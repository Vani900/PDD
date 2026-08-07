"""CharityAI – Payments Router (Stripe, Razorpay, UPI)"""
from __future__ import annotations
import uuid
from fastapi import APIRouter, BackgroundTasks, Depends, Header, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.infrastructure.database.models.core import Transaction, TransactionStatus, PaymentGateway
from app.infrastructure.database.models.users import User
from app.infrastructure.database.session import get_db
from app.presentation.dependencies.auth import get_current_user

router = APIRouter(prefix="/payments", tags=["Payments"])


@router.post("/stripe/create-intent", summary="Create Stripe PaymentIntent")
async def create_stripe_payment_intent(payload: dict, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> dict:
    try:
        import stripe
        stripe.api_key = settings.STRIPE_SECRET_KEY
        if not settings.STRIPE_SECRET_KEY:
            return {"error": "Stripe not configured"}
        amount_cents = int(float(payload.get("amount", 0)) * 100)
        intent = stripe.PaymentIntent.create(
            amount=amount_cents,
            currency=payload.get("currency", "inr").lower(),
            metadata={"user_id": str(current_user.id), "donation_id": payload.get("donation_id", ""), "platform": "charityai"},
        )
        txn = Transaction(donor_id=current_user.id, amount=float(payload.get("amount", 0)), currency=payload.get("currency", "INR"), net_amount=float(payload.get("amount", 0)), gateway=PaymentGateway.STRIPE, gateway_order_id=intent.id, status=TransactionStatus.INITIATED, created_by=str(current_user.id))
        db.add(txn)
        await db.flush()
        return {"client_secret": intent.client_secret, "payment_intent_id": intent.id, "transaction_id": str(txn.id)}
    except Exception as e:
        return {"error": str(e)}


@router.post("/stripe/webhook", summary="Stripe webhook handler")
async def stripe_webhook(request: Request, stripe_signature: str = Header(None), background_tasks: BackgroundTasks = BackgroundTasks(), db: AsyncSession = Depends(get_db)) -> dict:
    payload = await request.body()
    try:
        import stripe
        stripe.api_key = settings.STRIPE_SECRET_KEY
        event = stripe.Webhook.construct_event(payload, stripe_signature, settings.STRIPE_WEBHOOK_SECRET)
        if event.type == "payment_intent.succeeded":
            payment_intent = event.data.object
            result = await db.execute(select(Transaction).where(Transaction.gateway_order_id == payment_intent.id))
            txn = result.scalar_one_or_none()
            if txn:
                txn.status = TransactionStatus.SUCCESS
                txn.gateway_payment_id = payment_intent.id
                from datetime import UTC, datetime
                txn.completed_at = datetime.now(UTC)
        elif event.type == "payment_intent.payment_failed":
            payment_intent = event.data.object
            result = await db.execute(select(Transaction).where(Transaction.gateway_order_id == payment_intent.id))
            txn = result.scalar_one_or_none()
            if txn:
                txn.status = TransactionStatus.FAILED
        return {"status": "received"}
    except Exception as e:
        return {"error": str(e)}


@router.post("/razorpay/create-order", summary="Create Razorpay order")
async def create_razorpay_order(payload: dict, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> dict:
    try:
        import razorpay
        client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))
        if not settings.RAZORPAY_KEY_ID:
            return {"error": "Razorpay not configured"}
        amount_paise = int(float(payload.get("amount", 0)) * 100)
        order = client.order.create({"amount": amount_paise, "currency": payload.get("currency", "INR"), "payment_capture": 1, "notes": {"user_id": str(current_user.id)}})
        txn = Transaction(donor_id=current_user.id, amount=float(payload.get("amount", 0)), currency=payload.get("currency", "INR"), net_amount=float(payload.get("amount", 0)), gateway=PaymentGateway.RAZORPAY, gateway_order_id=order["id"], status=TransactionStatus.INITIATED, created_by=str(current_user.id))
        db.add(txn)
        await db.flush()
        return {"order_id": order["id"], "key": settings.RAZORPAY_KEY_ID, "transaction_id": str(txn.id)}
    except Exception as e:
        return {"error": str(e)}


@router.post("/razorpay/verify", summary="Verify Razorpay payment")
async def verify_razorpay_payment(payload: dict, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> dict:
    import razorpay
    import hmac, hashlib
    try:
        body = payload.get("razorpay_order_id", "") + "|" + payload.get("razorpay_payment_id", "")
        expected = hmac.new(settings.RAZORPAY_KEY_SECRET.encode(), body.encode(), hashlib.sha256).hexdigest()
        if expected != payload.get("razorpay_signature", ""):
            return {"verified": False}
        result = await db.execute(select(Transaction).where(Transaction.gateway_order_id == payload.get("razorpay_order_id")))
        txn = result.scalar_one_or_none()
        if txn:
            txn.status = TransactionStatus.SUCCESS
            txn.gateway_payment_id = payload.get("razorpay_payment_id")
        return {"verified": True, "transaction_id": str(txn.id) if txn else None}
    except Exception as e:
        return {"verified": False, "error": str(e)}


@router.get("/transactions", summary="Get my transaction history")
async def get_transactions(page: int = 1, page_size: int = 20, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> dict:
    from sqlalchemy import func
    query = select(Transaction).where(Transaction.donor_id == current_user.id, Transaction.is_deleted == False)
    total = await db.execute(select(func.count()).select_from(query.subquery()))
    query = query.order_by(Transaction.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    txns = result.scalars().all()
    return {"total": total.scalar_one(), "items": [{"id": str(t.id), "amount": t.amount, "currency": t.currency, "gateway": t.gateway, "status": t.status, "created_at": t.created_at.isoformat()} for t in txns]}
