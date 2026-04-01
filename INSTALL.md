# Yellow OS - installation

## 1. Download the latest version of this software and install required tools

**On Linux (Debian / Ubuntu):**

Log in as **root** and then run in terminal:

```sh
apt update
apt -y upgrade
apt -y install git curl
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc
git clone https://github.com/libersoft-org/yellow-os.git
cd yellow-os
```

Run backend and frontend:

### Backend:

**SKIP THIS AS THERE IS NO BACKEND YET**

```sh
cd backend
./start.sh
```

By default backend starts on a random network port (ws://localhost:XXXXX) and accepts connections from localhost only. If you'd like to start it publicly, you can use parameter **--host** (0.0.0.0 means to make it public on all networks). You can also change port by **--port** and if you need secure connection (wss://), add **--secure** parameter following with **--privkey** and **--pubkey** paths for private and public key of your domain certificate.

**For example:**

```sh
./start.sh --datadir ./data --host 0.0.0.0 --port 1158 --secure --privkey /etc/letsencrypt/live/example.com/privkey.pem --pubkey /etc/letsencrypt/live/example.com/fullchain.pem
```

### Frontend:

If you'd like to **run this software in developer mode**, you need HTTPS certificate keys.

You can either use your own certificate (e.g. from Let's Encrypt) with `--privkey` and `--pubkey` parameters, or generate a self-signed certificate:

```sh
openssl req -x509 -newkey rsa:2048 -nodes -days $(expr '(' $(date -d 2999/01/01 +%s) - $(date +%s) + 86399 ')' / 86400) -subj "/" -keyout server.key -out server.crt
```

... then run frontend in developer mode that connects to a specified port on backend:

With self-signed certificates in the frontend directory:

```sh
cd ../frontend
./start-dev.sh wss://localhost:1158/
```

With custom certificate paths:

```sh
cd ../frontend
./start-dev.sh wss://localhost:1158/ --privkey /etc/letsencrypt/live/example.com/privkey.pem --pubkey /etc/letsencrypt/live/example.com/fullchain.pem
```

Open your browser and navigate to: https://127.0.0.1:6004/

Browser will show the certificate error if you have self-signed certificate, just skip it.
