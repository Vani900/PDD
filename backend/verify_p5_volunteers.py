import asyncio
import httpx
import asyncpg
import uuid

async def live_verify_volunteers():
    print('==================================================')
    print('PHASE 5 VOLUNTEER SYSTEM LIVE & SQL VERIFICATION')
    print('==================================================')

    test_email = f'live_vol_{uuid.uuid4().hex[:6]}@charityai.org'
    test_pass = 'Password123!'

    # 1. Register & login volunteer
    print('\n[1/7] Registering & logging in new Volunteer...')
    async with httpx.AsyncClient(base_url='http://localhost:8000') as client:
        reg_res = await client.post('/api/v1/auth/register', json={
            'first_name': 'LiveVol',
            'last_name': 'Hero',
            'email': test_email,
            'password': test_pass,
            'role': 'volunteer'
        })
        assert reg_res.status_code == 201
        user_id = reg_res.json()['user_id']
        await client.post('/api/v1/auth/verify-email', json={'user_id': user_id, 'otp_code': '123456'})

        login_res = await client.post('/api/v1/auth/login', json={'email': test_email, 'password': test_pass})
        assert login_res.status_code == 200
        token = login_res.json()['access_token']
        headers = {'Authorization': f'Bearer {token}'}

        # 2. Register as Volunteer
        print('\n[2/7] Registering volunteer profile via POST /api/v1/volunteers/register...')
        v_res = await client.post('/api/v1/volunteers/register', json={
            'skills': ['medical_aid', 'disaster_management'],
            'service_radius_km': 25.0
        }, headers=headers)
        assert v_res.status_code == 201

        # 3. Create Task
        print('\n[3/7] Creating Volunteer Task via POST /api/v1/volunteers/tasks...')
        t_res = await client.post('/api/v1/volunteers/tasks', json={
            'title': 'Emergency Medical Kit Delivery',
            'task_type': 'delivery',
            'points_earned': 150
        }, headers=headers)
        assert t_res.status_code == 201
        task_id = t_res.json()['task_id']

        # 4. Accept & Checkin
        print('\n[4/7] Accepting & Checking in to Task...')
        await client.patch(f'/api/v1/volunteers/tasks/{task_id}/accept', headers=headers)
        chin_res = await client.post(f'/api/v1/volunteers/tasks/{task_id}/checkin', headers=headers)
        assert chin_res.status_code == 200

        # 5. Complete Task
        print('\n[5/7] Completing Task via POST /api/v1/volunteers/tasks/{id}/complete...')
        comp_res = await client.post(f'/api/v1/volunteers/tasks/{task_id}/complete', json={'notes': 'Delivered successfully'}, headers=headers)
        assert comp_res.status_code == 200
        print('Completion Response:', comp_res.json())

        # 6. Update Location
        print('\n[6/7] Updating GPS Location via POST /api/v1/volunteers/location...')
        loc_res = await client.post('/api/v1/volunteers/location', json={'latitude': 12.9716, 'longitude': 77.5946}, headers=headers)
        assert loc_res.status_code == 200

    # 7. Direct PostgreSQL Verification
    print('\n[7/7] Verifying SQL records in PostgreSQL (volunteers, volunteer_tasks)...')
    conn = await asyncpg.connect('postgresql://charityai_user:charityai_pass_2026@127.0.0.1:5432/charityai')
    v_row = await conn.fetchrow('SELECT id, total_tasks_completed, current_latitude FROM volunteers WHERE user_id = $1', uuid.UUID(user_id))
    assert v_row is not None
    print('SQL volunteers -> Total Tasks Completed:', v_row['total_tasks_completed'], '| Latitude:', v_row['current_latitude'])
    assert v_row['total_tasks_completed'] >= 1
    assert v_row['current_latitude'] == 12.9716

    t_row = await conn.fetchrow('SELECT id, status, completed_at FROM volunteer_tasks WHERE id = $1', uuid.UUID(task_id))
    assert t_row is not None
    print('SQL volunteer_tasks -> Status:', t_row['status'], '| Completed At:', t_row['completed_at'])
    assert t_row['status'] == 'completed'

    await conn.close()
    print('\n==================================================')
    print('SUCCESS: ALL PHASE 5 VOLUNTEER SYSTEM VERIFICATIONS PASSED!')
    print('==================================================')

if __name__ == '__main__':
    asyncio.run(live_verify_volunteers())
