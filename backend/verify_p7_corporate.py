import asyncio
import httpx
import asyncpg
import uuid

async def live_verify_corporate():
    print('==================================================')
    print('PHASE 7 CORPORATE PORTAL LIVE & SQL VERIFICATION')
    print('==================================================')

    test_email = f'live_corp_{uuid.uuid4().hex[:6]}@charityai.org'
    test_pass = 'Password123!'

    # 1. Register & login corporate user
    print('\n[1/6] Registering & logging in new Corporate User...')
    async with httpx.AsyncClient(base_url='http://localhost:8000') as client:
        reg_res = await client.post('/api/v1/auth/register', json={
            'first_name': 'LiveCorp',
            'last_name': 'Director',
            'email': test_email,
            'password': test_pass,
            'role': 'corporate_csr'
        })
        assert reg_res.status_code == 201
        user_id = reg_res.json()['user_id']
        await client.post('/api/v1/auth/verify-email', json={'user_id': user_id, 'otp_code': '123456'})

        login_res = await client.post('/api/v1/auth/login', json={'email': test_email, 'password': test_pass})
        assert login_res.status_code == 200
        token = login_res.json()['access_token']
        headers = {'Authorization': f'Bearer {token}'}

        # 2. Register Corporate Entity
        print('\n[2/6] Registering Corporate Entity via POST /api/v1/corporate/register...')
        corp_res = await client.post('/api/v1/corporate/register', json={
            'company_name': 'Sarvam Tech Corporate CSR',
            'description': 'Empowering communities through technology and healthcare.',
            'cin': 'U72200KA2022PTC987654',
            'city': 'Bangalore',
            'country': 'India'
        }, headers=headers)
        assert corp_res.status_code == 201
        org_id = corp_res.json()['organization_id']
        print('Corporate Entity Created -> ID:', org_id)

        # 3. Bulk Donations
        print('\n[3/6] Executing Bulk Donations via POST /api/v1/corporate/bulk-donations...')
        bulk_res = await client.post('/api/v1/corporate/bulk-donations', json={
            'donations': [
                {'title': 'Annual CSR Education Fund', 'amount': 200000.0, 'donation_type': 'education'},
                {'title': 'Emergency Food Relief Grant', 'amount': 300000.0, 'donation_type': 'food'}
            ]
        }, headers=headers)
        assert bulk_res.status_code == 201
        print('Bulk Donations Created Total:', bulk_res.json()['total_amount'])

        # 4. Get CSR Dashboard
        print('\n[4/6] Fetching CSR Dashboard Metrics via GET /api/v1/corporate/dashboard...')
        dash_res = await client.get('/api/v1/corporate/dashboard', headers=headers)
        assert dash_res.status_code == 200
        print('CSR Dashboard -> Total Donated:', dash_res.json()['total_donated'], '| Tax Saved Estimate:', dash_res.json()['tax_saved_estimate'])

        # 5. Generate Annual Report
        print('\n[5/6] Generating Annual CSR Report via GET /api/v1/corporate/csr-report/2026...')
        rep_res = await client.get('/api/v1/corporate/csr-report/2026', headers=headers)
        assert rep_res.status_code == 200
        print('CSR Report -> 80G Deduction Eligible:', rep_res.json()['tax_80g_deduction_eligible'])

    # 6. Direct PostgreSQL Verification
    print('\n[6/6] Verifying SQL records in PostgreSQL (organizations, donations)...')
    conn = await asyncpg.connect('postgresql://charityai_user:charityai_pass_2026@127.0.0.1:5432/charityai')
    o_row = await conn.fetchrow('SELECT id, name, org_type FROM organizations WHERE id = $1', uuid.UUID(org_id))
    assert o_row is not None
    print('SQL organizations -> Name:', o_row['name'], '| Type:', o_row['org_type'])
    assert o_row['org_type'] == 'corporate'

    don_count = await conn.fetchval('SELECT count(*) FROM donations WHERE donor_id = $1', uuid.UUID(user_id))
    print('SQL corporate donations Count:', don_count)
    assert don_count == 2

    await conn.close()
    print('\n==================================================')
    print('SUCCESS: ALL PHASE 7 CORPORATE PORTAL VERIFICATIONS PASSED!')
    print('==================================================')

if __name__ == '__main__':
    asyncio.run(live_verify_corporate())
