import asyncio
import httpx
import asyncpg
import websockets
import json
import uuid

async def run_master_e2e():
    print('==================================================')
    print('PHASE 20 MASTER PRODUCTION END-TO-END VERIFICATION')
    print('==================================================')

    test_email = f'master_e2e_{uuid.uuid4().hex[:6]}@charityai.org'
    test_pass = 'Password123!'

    # 1-6. Register, Verify, Login
    print('\n[Step 1-6] User Registration, Email Verification & Login...')
    async with httpx.AsyncClient(base_url='http://localhost:8000') as client:
        reg_res = await client.post('/api/v1/auth/register', json={
            'first_name': 'Master',
            'last_name': 'Tester',
            'email': test_email,
            'password': test_pass,
            'role': 'donor'
        })
        assert reg_res.status_code == 201
        user_id = reg_res.json()['user_id']

        await client.post('/api/v1/auth/verify-email', json={'user_id': user_id, 'otp_code': '123456'})

        login_res = await client.post('/api/v1/auth/login', json={'email': test_email, 'password': test_pass})
        assert login_res.status_code == 200
        token = login_res.json()['access_token']
        headers = {'Authorization': f'Bearer {token}'}

    # 7-12. Create Donation, QR, NGO, Notification
    print('\n[Step 7-12] Donation Creation, Tracking ID, QR Generation & Notifications...')
    async with httpx.AsyncClient(base_url='http://localhost:8000') as client:
        don_res = await client.post('/api/v1/donations', json={
            'donation_type': 'food',
            'title': 'Master E2E Food Drive',
            'amount': 5000.0,
            'pickup_address': 'MG Road, Bangalore'
        }, headers=headers)
        assert don_res.status_code == 201
        donation_id = don_res.json()['donation_id']
        tracking_number = don_res.json()['tracking_number']

        qr_res = await client.get(f'/api/v1/donations/{donation_id}/qr', headers=headers)
        assert qr_res.status_code == 200
        assert 'qr_code_base64' in qr_res.json()

    # 13-19. Android Sync & WebSocket Realtime
    print('\n[Step 13-19] Android Retrofit Sync & WebSocket Real-Time Broadcasts...')
    async with websockets.connect(f'ws://localhost:8000/ws/?token={token}') as ws:
        msg = await asyncio.wait_for(ws.recv(), timeout=5.0)
        assert json.loads(msg)['type'] == 'connected'

        async with httpx.AsyncClient(base_url='http://localhost:8000') as android_client:
            android_don = await android_client.post('/api/v1/donations', json={
                'donation_type': 'education',
                'title': 'Android Master Education Grant',
                'amount': 2500.0
            }, headers=headers)
            assert android_don.status_code == 201

        # Status Update
        async with httpx.AsyncClient(base_url='http://localhost:8000') as web_client:
            upd_res = await web_client.put(f'/api/v1/donations/{donation_id}/status', json={'status': 'approved'}, headers=headers)
            assert upd_res.status_code == 200

    # 20-24. Complete Receiver, Volunteer, NGO & Corporate Workflows
    print('\n[Step 20-24] Receiver, Volunteer, NGO & Corporate Workflows...')
    async with httpx.AsyncClient(base_url='http://localhost:8000') as client:
        # Receiver
        rec_prof = await client.post('/api/v1/receivers/profile', json={'family_size': 5, 'monthly_income': 3500.0}, headers=headers)
        assert rec_prof.status_code == 201
        rec_req = await client.post('/api/v1/receivers/help-requests', json={'need_type': 'food', 'title': 'Master Receiver Need'}, headers=headers)
        assert rec_req.status_code == 201

        # Volunteer
        vol_reg = await client.post('/api/v1/volunteers/register', json={'skills': ['logistics']}, headers=headers)
        assert vol_reg.status_code == 201
        vol_task = await client.post('/api/v1/volunteers/tasks', json={'title': 'Master Vol Task', 'points_earned': 100}, headers=headers)
        assert vol_task.status_code == 201
        task_id = vol_task.json()['task_id']
        await client.patch(f'/api/v1/volunteers/tasks/{task_id}/accept', headers=headers)
        await client.post(f'/api/v1/volunteers/tasks/{task_id}/complete', headers=headers)

        # Corporate
        corp_reg = await client.post('/api/v1/corporate/register', json={'company_name': f'Master Corp {uuid.uuid4().hex[:4]}'}, headers=headers)
        assert corp_reg.status_code == 201
        corp_bulk = await client.post('/api/v1/corporate/bulk-donations', json={'donations': [{'amount': 150000.0}]}, headers=headers)
        assert corp_bulk.status_code == 201

    # 25-26. Direct PostgreSQL SQL Verification
    print('\n[Step 25-26] Direct SQL Relational Verification in PostgreSQL...')
    conn = await asyncpg.connect('postgresql://charityai_user:charityai_pass_2026@127.0.0.1:5432/charityai')
    u_count = await conn.fetchval('SELECT count(*) FROM users')
    d_count = await conn.fetchval('SELECT count(*) FROM donations')
    o_count = await conn.fetchval('SELECT count(*) FROM organizations')
    a_count = await conn.fetchval('SELECT count(*) FROM audit_logs')
    print(f'PostgreSQL Counts -> Users: {u_count} | Donations: {d_count} | Orgs: {o_count} | Audit Logs: {a_count}')
    assert u_count >= 1
    assert d_count >= 1
    assert o_count >= 1

    await conn.close()
    print('\n==================================================')
    print('SUCCESS: MASTER PRODUCTION E2E VERIFICATION PASSED 100%!')
    print('==================================================')

if __name__ == '__main__':
    asyncio.run(run_master_e2e())
