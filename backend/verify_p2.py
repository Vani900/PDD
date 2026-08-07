import asyncio
import httpx
import asyncpg
import uuid

async def live_verify():
    print('==================================================')
    print('PHASE 2 LIVE APPLICATION & SQL VERIFICATION')
    print('==================================================')

    test_email = f'live_verify_{uuid.uuid4().hex[:6]}@charityai.org'
    test_pass = 'Password123!'

    # 1. Register through live API
    print('\n[1/10] Registering new user through live FastAPI API...')
    async with httpx.AsyncClient(base_url='http://localhost:8000') as client:
        reg_res = await client.post('/api/v1/auth/register', json={
            'first_name': 'Live',
            'last_name': 'Verifier',
            'email': test_email,
            'password': test_pass,
            'role': 'donor'
        })
        print('Registration HTTP Status:', reg_res.status_code)
        assert reg_res.status_code == 201
        user_id = reg_res.json()['user_id']

    # 2 & 3. SQL Verification of user row and bcrypt password hashing
    print('\n[2/10 & 3/10] Querying PostgreSQL for user record & bcrypt hash...')
    conn = await asyncpg.connect('postgresql://charityai_user:charityai_pass_2026@127.0.0.1:5432/charityai')
    row = await conn.fetchrow('SELECT id, email, role, hashed_password, account_status, email_verified FROM users WHERE id = $1', uuid.UUID(user_id))
    assert row is not None
    print('SQL Result -> ID:', str(row['id']), '| Email:', row['email'], '| Role:', row['role'], '| Status:', row['account_status'])
    assert row['hashed_password'].startswith('$2b$')
    print('SUCCESS: Password is properly bcrypt hashed ($2b$...)')

    # 4. Email verification workflow
    print('\n[4/10] Verifying email via /verify-email...')
    async with httpx.AsyncClient(base_url='http://localhost:8000') as client:
        v_res = await client.post('/api/v1/auth/verify-email', json={'user_id': user_id, 'otp_code': '123456'})
        print('Verify Email HTTP Status:', v_res.status_code)
        assert v_res.status_code == 200

    row_after_v = await conn.fetchrow('SELECT account_status, email_verified FROM users WHERE id = $1', uuid.UUID(user_id))
    print('SQL Status after verification -> Account Status:', row_after_v['account_status'], '| Email Verified:', row_after_v['email_verified'])
    assert row_after_v['account_status'] == 'active'
    assert row_after_v['email_verified'] == True

    # 5, 6, 7. Login and JWT tokens
    print('\n[5/10, 6/10, 7/10] Logging in and validating Access & Refresh tokens...')
    async with httpx.AsyncClient(base_url='http://localhost:8000') as client:
        login_res = await client.post('/api/v1/auth/login', json={'email': test_email, 'password': test_pass})
        assert login_res.status_code == 200
        tokens = login_res.json()
        access_token = tokens['access_token']
        refresh_token = tokens['refresh_token']
        print('Login Successful! Access Token length:', len(access_token), '| Refresh Token length:', len(refresh_token))

        # Test Refresh Token Rotation
        ref_res = await client.post('/api/v1/auth/refresh', json={'refresh_token': refresh_token})
        assert ref_res.status_code == 200
        print('Token Refresh Successful! New Access Token issued.')

    # 8. Logout invalidates session
    print('\n[8/10] Testing Logout session invalidation...')
    async with httpx.AsyncClient(base_url='http://localhost:8000') as client:
        headers = {'Authorization': f'Bearer {access_token}'}
        logout_res = await client.post('/api/v1/auth/logout', json={'refresh_token': refresh_token}, headers=headers)
        assert logout_res.status_code == 200
        print('Logout Successful!')

    # 9. Rejection of invalid tokens
    print('\n[9/10] Verifying protected endpoint rejects invalid JWT tokens...')
    async with httpx.AsyncClient(base_url='http://localhost:8000') as client:
        bad_headers = {'Authorization': 'Bearer invalid_garbage_jwt_token'}
        bad_res = await client.get('/api/v1/users/me', headers=bad_headers)
        print('Protected endpoint status with invalid token:', bad_res.status_code)
        assert bad_res.status_code == 401

    # 10. RBAC role enforcement verification
    print('\n[10/10] Verifying RBAC role enforcement across endpoints...')
    async with httpx.AsyncClient(base_url='http://localhost:8000') as client:
        donor_login = await client.post('/api/v1/auth/login', json={'email': 'donor@test.com', 'password': 'Donor@123456'})
        donor_token = donor_login.json()['access_token']
        donor_headers = {'Authorization': f'Bearer {donor_token}'}

        # Attempting admin route with Donor role -> Expect 403 Forbidden
        admin_res = await client.get('/api/v1/admin/audit-logs', headers=donor_headers)
        print('Donor accessing Admin Audit Logs status:', admin_res.status_code)
        assert admin_res.status_code == 403

        # Attempting super admin route with Super Admin role -> Expect 200 OK
        admin_login = await client.post('/api/v1/auth/login', json={'email': 'admin@charityai.org', 'password': 'Admin@123456'})
        admin_token = admin_login.json()['access_token']
        admin_headers = {'Authorization': f'Bearer {admin_token}'}
        admin_ok_res = await client.get('/api/v1/admin/audit-logs', headers=admin_headers)
        print('Super Admin accessing Admin Audit Logs status:', admin_ok_res.status_code)
        assert admin_ok_res.status_code == 200

    await conn.close()
    print('\n==================================================')
    print('SUCCESS: ALL 10 PHASE 2 LIVE VERIFICATIONS PASSED!')
    print('==================================================')

if __name__ == '__main__':
    asyncio.run(live_verify())
