import asyncio
import httpx
import websockets
import json

async def verify_realtime():
    print('==================================================')
    print('PHASE 10 REALTIME WEBSOCKET & EVENT BROADCAST VERIFICATION')
    print('==================================================')

    # 1. Login donor
    print('\n[1/4] Logging in to obtain JWT access token...')
    async with httpx.AsyncClient(base_url='http://localhost:8000') as client:
        login_res = await client.post('/api/v1/auth/login', json={'email': 'donor@test.com', 'password': 'Donor@123456'})
        assert login_res.status_code == 200
        token = login_res.json()['access_token']
        headers = {'Authorization': f'Bearer {token}'}

    # 2. Connect to WebSocket endpoint with token
    print('\n[2/4] Connecting to WebSocket ws://localhost:8000/ws/?token=...')
    ws_url = f'ws://localhost:8000/ws/?token={token}'
    async with websockets.connect(ws_url) as ws:
        # Welcome event
        welcome_msg = await asyncio.wait_for(ws.recv(), timeout=5.0)
        welcome_data = json.loads(welcome_msg)
        print('WebSocket Welcome Message:', welcome_data)
        assert welcome_data['type'] == 'connected'

        # 3. Ping/pong test
        print('\n[3/4] Testing WebSocket Ping/Pong frame exchange...')
        await ws.send(json.dumps({'type': 'ping'}))
        pong_msg = await asyncio.wait_for(ws.recv(), timeout=5.0)
        pong_data = json.loads(pong_msg)
        print('WebSocket Response:', pong_data)
        assert pong_data['type'] == 'pong'

        # 4. Subscribe to live_feed room and trigger real-time donation event via HTTP
        print('\n[4/4] Subscribing to live_feed room & testing live event broadcast...')
        await ws.send(json.dumps({'type': 'subscribe_live_feed'}))
        sub_ack = await asyncio.wait_for(ws.recv(), timeout=5.0)
        print('Subscription ACK:', json.loads(sub_ack))

        # Trigger HTTP POST creation while WS is open
        async with httpx.AsyncClient(base_url='http://localhost:8000') as client:
            don_res = await client.post('/api/v1/donations', json={
                'donation_type': 'food',
                'title': 'Realtime WS Broadcast Test Pack',
                'amount': 1500.0
            }, headers=headers)
            assert don_res.status_code == 201

        # Receive broadcast over WebSocket
        broadcast_msg = await asyncio.wait_for(ws.recv(), timeout=5.0)
        broadcast_data = json.loads(broadcast_msg)
        print('WebSocket Received Real-Time Event:', broadcast_data)
        assert broadcast_data['type'] == 'live_feed'

    print('\n==================================================')
    print('SUCCESS: PHASE 10 REALTIME WEBSOCKET VERIFICATIONS PASSED!')
    print('==================================================')

if __name__ == '__main__':
    asyncio.run(verify_realtime())
