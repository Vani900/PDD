import asyncio
import httpx
import asyncpg
import uuid

async def live_verify_ngos():
    print('==================================================')
    print('PHASE 6 NGO SYSTEM LIVE & SQL VERIFICATION')
    print('==================================================')

    # 1. Login NGO admin
    print('\n[1/6] Logging in NGO Admin...')
    async with httpx.AsyncClient(base_url='http://localhost:8000') as client:
        login_res = await client.post('/api/v1/auth/login', json={'email': 'ngo@sarvam.org', 'password': 'NGO@123456'})
        assert login_res.status_code == 200
        token = login_res.json()['access_token']
        headers = {'Authorization': f'Bearer {token}'}

        # 2. Register NGO
        print('\n[2/6] Registering NGO via POST /api/v1/ngos...')
        ngo_name = f'Sarvam Live Trust {uuid.uuid4().hex[:4]}'
        ngo_res = await client.post('/api/v1/ngos', json={
            'name': ngo_name,
            'description': 'Disaster & education support across South India.',
            'city': 'Bangalore',
            'country': 'India'
        }, headers=headers)
        assert ngo_res.status_code == 201
        ngo_id = ngo_res.json()['ngo_id']
        print('NGO Created -> ID:', ngo_id)

        # 3. Upload Verification Document
        print('\n[3/6] Uploading KYC Document via POST /api/v1/ngos/{id}/documents...')
        doc_res = await client.post(f'/api/v1/ngos/{ngo_id}/documents', json={
            'document_type': 'registration_certificate',
            'file_url': 'https://storage.charityai.org/docs/sarvam_reg.pdf'
        }, headers=headers)
        assert doc_res.status_code == 201

        # 4. Verify NGO (Admin)
        print('\n[4/6] Verifying NGO status via POST /api/v1/ngos/{id}/verify...')
        admin_login = await client.post('/api/v1/auth/login', json={'email': 'admin@charityai.org', 'password': 'Admin@123456'})
        admin_headers = {'Authorization': f"Bearer {admin_login.json()['access_token']}"}

        ver_res = await client.post(f'/api/v1/ngos/{ngo_id}/verify', json={'action': 'verify'}, headers=admin_headers)
        assert ver_res.status_code == 200
        print('Verification Response:', ver_res.json())

        # 5. Create Campaign
        print('\n[5/6] Creating Campaign via POST /api/v1/ngos/{id}/campaigns...')
        c_res = await client.post(f'/api/v1/ngos/{ngo_id}/campaigns', json={
            'title': 'Emergency Flood Relief 2026',
            'campaign_type': 'disaster_relief',
            'goal_amount': 250000.0
        }, headers=headers)
        assert c_res.status_code == 201
        print('Campaign Response:', c_res.json())

    # 6. Direct PostgreSQL Verification
    print('\n[6/6] Verifying SQL records in PostgreSQL (organizations, organization_documents, campaigns)...')
    conn = await asyncpg.connect('postgresql://charityai_user:charityai_pass_2026@127.0.0.1:5432/charityai')
    o_row = await conn.fetchrow('SELECT id, name, verification_status FROM organizations WHERE id = $1', uuid.UUID(ngo_id))
    assert o_row is not None
    print('SQL organizations -> Name:', o_row['name'], '| Verification Status:', o_row['verification_status'])
    assert o_row['verification_status'] == 'verified'

    doc_count = await conn.fetchval('SELECT count(*) FROM organization_documents WHERE organization_id = $1', uuid.UUID(ngo_id))
    print('SQL organization_documents Count:', doc_count)
    assert doc_count >= 1

    camp_count = await conn.fetchval('SELECT count(*) FROM campaigns WHERE organization_id = $1', uuid.UUID(ngo_id))
    print('SQL campaigns Count:', camp_count)
    assert camp_count >= 1

    await conn.close()
    print('\n==================================================')
    print('SUCCESS: ALL PHASE 6 NGO SYSTEM VERIFICATIONS PASSED!')
    print('==================================================')

if __name__ == '__main__':
    asyncio.run(live_verify_ngos())
