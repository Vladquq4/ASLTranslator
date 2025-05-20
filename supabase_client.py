from dotenv import load_dotenv
import os
from supabase import create_client, Client

load_dotenv(dotenv_path="C:/Users/Vlad/PycharmProjects/PythonProject1/db.env")

supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY")

if not supabase_url or not supabase_key:
    print("Error: Supabase URL or Key not loaded correctly!")
else:
    supabase: Client = create_client(supabase_url, supabase_key)

    data = supabase.table('users').select('*').execute()
    print(data)
