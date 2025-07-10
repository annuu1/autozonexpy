from app.dmats.login.kotak_fns import kotak_login

def kotak_login_controller():
    client = kotak_login()
    return client