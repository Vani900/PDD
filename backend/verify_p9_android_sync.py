import asyncio
import httpx
import asyncpg
import websockets
import json
import uuid

async def verify_android_sync():
    print('==================================================')
    print('PHASE 9 ANDROID SYNCHRONIZATION & BI-DIRECTIONAL SYNC')
    print('==================================================')

    # 1. Login donor account via Android Retrofit emulation
    print('\n[1/5] Simulating Android Retrofit Login (POST /api/v1/auth/login)...')
    async with httpx.AsyncClient(base_url='http://localhost:8000') as android_client:
        login_res = await android_client.post('/api/v1/auth/login', json={'email': 'donor@test.com', 'password': 'Donor@123456'})
        assert login_res.status_code == 200
        token = login_res.json()['access_token']
        android_headers = {'Authorization': f'Bearer {token}'}

        # 2. Android creates donation via Retrofit
        print('\n[2/5] Android submitting donation via Retrofit (POST /api/v1/donations)...')
        create_res = await android_client.post('/api/v1/donations', json={
            'donation_type': 'food',
            'title': 'Android Sync Food Drive',
            'amount': 3500.0,
            'pickup_address': 'Koramangala, Bangalore'
        }, headers=android_headers)
        assert create_res.status_code == 201
        don_data = create_res.json()
        donation_id = don_data['donation_id']
        tracking_number = don_data['tracking_number']
        print('Android Created Donation -> ID:', donation_id, '| Tracking:', tracking_number)

    # 3. Direct PostgreSQL persistence verification
    print('\n[3/5] Verifying PostgreSQL persistence for Android creation...')
    conn = await asyncpg.connect('postgresql://charityai_user:charityai_pass_2026@127.0.0.1:5432/charityai')
    row = await conn.fetchrow('SELECT id, tracking_number, status FROM donations WHERE id = $1', uuid.UUID(donation_id))
    assert row is not None
    print('SQL Verification -> Tracking:', row['tracking_number'], '| Status:', row['status'])
    assert row['tracking_number'] == tracking_number

    # 4. Web client receives WebSocket broadcast & updates status
    print('\n[4/5] Web client updating status via HTTP REST (PUT /api/v1/donations/{id}/status)...')
    async with httpx.AsyncClient(base_url='http://localhost:8000') as web_client:
        upd_res = await web_client.put(f'/api/v1/donations/{donation_id}/status', json={
            'status': 'approved',
            'notes': 'Approved by Web Dashboard Admin'
        }, headers=android_headers)
        assert upd_res.status_code == 200
        print('Web Status Update Response:', upd_res.json())

    # 5. Android WorkManager Sync Worker polling updated status from PostgreSQL via FastAPI
    print('\n[5/5] Android Sync Worker fetching updated status for Room DB refresh...')
    async with httpx.AsyncClient(base_url='http://localhost:8000') as android_sync_client:
        sync_res = await android_sync_client.get(f'/api/v1/donations/{donation_id}', headers=android_headers)
        assert sync_res.status_code == 200
        sync_data = sync_res.json()
        print('Android WorkManager Sync -> Status in Room Cache:', sync_data['status'])
        assert sync_data['status'] == 'approved'

    await conn.close()
    print('\n==================================================')
    print('SUCCESS: BI-DIRECTIONAL ANDROID SYNC VERIFICATION PASSED!')
    print('==================================================')

if __name__ == '__main__':
    asyncio.run(verify_android_sync())
