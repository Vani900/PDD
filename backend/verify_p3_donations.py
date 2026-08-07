import asyncio
import httpx
import asyncpg
import uuid

async def live_verify_donations():
    print('==================================================')
    print('PHASE 3 DONATION SYSTEM LIVE & SQL VERIFICATION')
    print('==================================================')

    # 1. Login seeded donor
    print('\n[1/6] Logging in seeded donor...')
    async with httpx.AsyncClient(base_url='http://localhost:8000') as client:
        login_res = await client.post('/api/v1/auth/login', json={'email': 'donor@test.com', 'password': 'Donor@123456'})
        assert login_res.status_code == 200
        token = login_res.json()['access_token']
        headers = {'Authorization': f'Bearer {token}'}

        # 2. Create Donation
        print('\n[2/6] Creating donation via POST /api/v1/donations...')
        create_res = await client.post('/api/v1/donations', json={
            'donation_type': 'food',
            'title': 'Live Verification Meal Packs',
            'description': 'Fresh packed meals for 50 people',
            'amount': 2500.0,
            'pickup_address': 'Indiranagar 100ft Rd',
            'pickup_city': 'Bangalore',
            'items': [
                {'name': 'Meal Box', 'quantity': 50, 'unit': 'boxes', 'condition': 'fresh'}
            ]
        }, headers=headers)
        assert create_res.status_code == 201
        don_data = create_res.json()
        donation_id = don_data['donation_id']
        tracking_number = don_data['tracking_number']
        print('Donation Created -> ID:', donation_id, '| Tracking ID:', tracking_number)
        assert tracking_number.startswith('DON-')

        # 3. Get QR Code
        print('\n[3/6] Fetching QR Code via GET /api/v1/donations/{id}/qr...')
        qr_res = await client.get(f'/api/v1/donations/{donation_id}/qr', headers=headers)
        assert qr_res.status_code == 200
        assert 'qr_code_base64' in qr_res.json()

        # 4. Update Status
        print('\n[4/6] Updating Status via PUT /api/v1/donations/{id}/status...')
        st_res = await client.put(f'/api/v1/donations/{donation_id}/status', json={'status': 'approved', 'notes': 'Approved by NGO'}, headers=headers)
        assert st_res.status_code == 200
        print('Status Update Response:', st_res.json())

        # 5. Verify QR Code Scan
        print('\n[5/6] Verifying QR scan via POST /api/v1/donations/{id}/verify-qr...')
        v_res = await client.post(f'/api/v1/donations/{donation_id}/verify-qr', headers=headers)
        assert v_res.status_code == 200

    # 6. Direct PostgreSQL Verification
    print('\n[6/6] Verifying SQL records in PostgreSQL (donations, items, history, notifications)...')
    conn = await asyncpg.connect('postgresql://charityai_user:charityai_pass_2026@127.0.0.1:5432/charityai')
    d_row = await conn.fetchrow('SELECT id, tracking_number, status, qr_verified FROM donations WHERE id = $1', uuid.UUID(donation_id))
    assert d_row is not None
    print('SQL donations -> Tracking ID:', d_row['tracking_number'], '| Status:', d_row['status'], '| QR Verified:', d_row['qr_verified'])
    assert d_row['status'] == 'approved'
    assert d_row['qr_verified'] == True

    item_count = await conn.fetchval('SELECT count(*) FROM donation_items WHERE donation_id = $1', uuid.UUID(donation_id))
    print('SQL donation_items Count:', item_count)
    assert item_count >= 1

    history_count = await conn.fetchval('SELECT count(*) FROM donation_status_history WHERE donation_id = $1', uuid.UUID(donation_id))
    print('SQL donation_status_history Count:', history_count)
    assert history_count >= 1

    notif_count = await conn.fetchval('SELECT count(*) FROM notifications WHERE entity_id = $1', str(donation_id))
    print('SQL notifications Count:', notif_count)
    assert notif_count >= 1

    await conn.close()
    print('\n==================================================')
    print('SUCCESS: ALL PHASE 3 DONATION SYSTEM VERIFICATIONS PASSED!')
    print('==================================================')

if __name__ == '__main__':
    asyncio.run(live_verify_donations())
