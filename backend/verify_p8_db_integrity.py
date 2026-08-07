import asyncio
import asyncpg

async def verify_db_integrity():
    print('==================================================')
    print('PHASE 8 DATABASE INTEGRITY & SQL VERIFICATION')
    print('==================================================')

    conn = await asyncpg.connect('postgresql://charityai_user:charityai_pass_2026@127.0.0.1:5432/charityai')

    tables = [
        "users",
        "user_profiles",
        "donations",
        "donation_items",
        "donation_status_history",
        "organizations",
        "organization_documents",
        "volunteers",
        "volunteer_tasks",
        "receiver_profiles",
        "help_requests",
        "campaigns",
        "notifications",
        "audit_logs",
        "user_sessions",
        "refresh_tokens",
    ]

    print("\n--- 1. TABLE ROW COUNTS ---")
    total_rows = 0
    for tbl in tables:
        count = await conn.fetchval(f"SELECT count(*) FROM {tbl}")
        print(f"Table '{tbl}': {count} rows")
        assert count >= 0
        total_rows += count

    print(f"\nTotal Rows Verified Across All 16 Tables: {total_rows}")

    print("\n--- 2. FOREIGN KEY INTEGRITY CHECKS ---")
    # Verify every user_profiles.user_id points to a valid user
    orphaned_profiles = await conn.fetchval("SELECT count(*) FROM user_profiles p LEFT JOIN users u ON p.user_id = u.id WHERE u.id IS NULL")
    print(f"Orphaned User Profiles: {orphaned_profiles}")
    assert orphaned_profiles == 0

    # Verify every donation.donor_id points to a valid user
    orphaned_donations = await conn.fetchval("SELECT count(*) FROM donations d LEFT JOIN users u ON d.donor_id = u.id WHERE u.id IS NULL")
    print(f"Orphaned Donations: {orphaned_donations}")
    assert orphaned_donations == 0

    # Verify every help_request.receiver_id points to a valid receiver_profile
    orphaned_requests = await conn.fetchval("SELECT count(*) FROM help_requests r LEFT JOIN receiver_profiles p ON r.receiver_id = p.id WHERE p.id IS NULL")
    print(f"Orphaned Help Requests: {orphaned_requests}")
    assert orphaned_requests == 0

    # Verify every volunteer_tasks.volunteer_id points to a valid volunteer
    orphaned_tasks = await conn.fetchval("SELECT count(*) FROM volunteer_tasks t LEFT JOIN volunteers v ON t.volunteer_id = v.id WHERE v.id IS NULL")
    print(f"Orphaned Volunteer Tasks: {orphaned_tasks}")
    assert orphaned_tasks == 0

    await conn.close()
    print('\n==================================================')
    print('SUCCESS: ALL PHASE 8 DATABASE INTEGRITY CHECKS PASSED!')
    print('==================================================')

if __name__ == '__main__':
    asyncio.run(verify_db_integrity())
