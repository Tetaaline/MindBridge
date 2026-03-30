# MindBridge — Private Online Therapy Platform

An anonymous, browser-based therapy platform connecting users in Africa with licensed therapists.  
Users can search, filter, and book sessions, read live mental health articles, and chat privately in real time all without creating an account;  this was made in response to problem of bad streotypes around therapy and seeking mental health support in Africa.

Live link: https://alineteta.me


---

## Project Structure

```
mindbridge/
├── index.html          ← HTML structure and layout
├── style.css           ← All styles and design tokens
├── config.js           ← API keys (gitignored — do NOT commit)
├── config.example.js   ← Template showing required keys (committed)
├── app.js              ← Application logic, data, and API calls
├── deploy.sh           ← One-command deployment to web servers
├── .gitignore          ← Excludes config.js and junk files
└── README.md
```
---

## External APIs Used

### 1. The Guardian Open Platform
> Real-time mental health news and articles powering the Resources section

- **Docs**: https://open-platform.theguardian.com/documentation/
- **Register**: https://bonobo.capi.gutools.co.uk/register/developer
- **Free tier**: 5,000 requests/day · Works on any domain · No credit card required
- **Endpoint used**: `GET https://content.guardianapis.com/search`
- **Features**: search, filter by topic, sort by newest/relevance/oldest, article thumbnails and summaries

### 2. Stream Chat SDK
> Real-time encrypted private messaging between users and therapists

- **Docs**: https://getstream.io/chat/docs/javascript/
- **Register**: https://getstream.io
- **Free tier**: 100 MAU/month · Unlimited messages
- **SDK**: `stream-chat@8.17.0` loaded from jsDelivr CDN

---
---

## Configure API Keys

**Step 1 — Copy the template**
```bash
cp config.example.js config.js
```

**Step 2 — Get your Guardian API key**
1. Go to https://bonobo.capi.gutools.co.uk/register/developer
2. Fill in the form (select **"Student project"** as reason)
3. Check your email — the key arrives within minutes
4. Paste the key into `config.js`:
```js
GUARDIAN_API_KEY: 'paste_your_key_here',
```

**Step 3 — Get your Stream Chat API key**
1. Go to https://getstream.io and sign up
2. Click **Create App** → give it a name → choose **Development** environment
3. In your app dashboard: **Chat → Authentication → enable "Disable Auth Checks"**
4. Go to the **Overview** tab → copy the **API Key**
5. Paste it into `config.js`:
```js
STREAM_API_KEY: 'paste_your_key_here',
```

> Browse, filter, and bookings work without any keys.  
> The Resources section requires the Guardian key.  
> Chat requires the Stream key.

---

## Deploy to Web01 and Web02

Use the included `deploy.sh` — it handles everything in one command:

```bash
bash deploy.sh <WEB01_IP> <WEB02_IP> <LB01_IP> [ssh-user]

# Example:
bash deploy.sh 10.0.0.11 10.0.0.12 10.0.0.10 ubuntu
```

**What the script does automatically:**
1. Copies `index.html`, `style.css`, `app.js`, `config.js`, `config.example.js` to both web servers via `scp`
2. Installs Nginx on each server if not already present
3. Enables and reloads Nginx on each web server
4. SSHes into Lb01 and writes a least-connection load-balancer config
5. Runs 4 test requests to verify traffic is being balanced

## Configure Load Balancer (Lb01)

The script writes this Nginx config automatically, but here it is for reference:

```nginx
upstream mindbridge {
    least_conn;
    server WEB01_IP:80 max_fails=3 fail_timeout=30s;
    server WEB02_IP:80 max_fails=3 fail_timeout=30s;
}

server {
    listen 80;
    server_name _;
    add_header X-Served-By $upstream_addr always;

    location / {
        proxy_pass         http://mindbridge;
        proxy_http_version 1.1;
        proxy_set_header   Host            $host;
        proxy_set_header   X-Real-IP       $remote_addr;
        proxy_next_upstream error timeout http_502 http_503;
    }
}
```

**Verify load balancing is working:**
```bash
for i in {1..4}; do curl -sI http://LB01_IP | grep X-Served-By; done
# Output should show Web01 and Web02 IPs alternating
```

---

## Application Features

| Feature | Description |
|---------|-------------|
| Anonymous sessions | No account, name, or email required |
| Therapist directory | 20 licensed therapists with full profiles |
| Search | Full-text search across name, specialization, and bio |
| Filter by specialization | 20 specializations including ADHD, Trauma, Grief, PTSD |
| Filter by language | Kinyarwanda, French, English, Spanish, Kiswahili |
| Sort | By name A–Z or years of experience |
| Booking system | Choose day, time, session length (30–90 min), and language |
| My Bookings | View and manage all confirmed sessions |
| Mental Health Resources | Live articles from The Guardian — searchable, filterable, sortable |
| Private chat | Real-time encrypted messaging via Stream Chat |
| Error handling | Loading skeletons, API error messages, retry buttons, form validation |
| Responsive layout | Works on desktop, tablet, and mobile |

---

## Security

- No personal information is collected or stored server-side
- Only the **public** API key is used client-side — secrets never leave your server
- All rendered output is HTML-escaped to prevent XSS
- `config.js` is gitignored — keys never reach the public GitHub repository
- Session data (anonymous UUID and bookings) lives in `localStorage` and is wiped on logout

---

## API & Resource Credits

| Resource | Purpose | License / Terms |
|----------|---------|----------------|
| [The Guardian Open Platform](https://open-platform.theguardian.com) | Mental health articles | [Guardian Open Platform T&C](https://open-platform.theguardian.com/terms/) |
| [Stream Chat](https://getstream.io/chat/) | Real-time encrypted messaging | [Stream Terms](https://getstream.io/terms/) |
| [Stream Chat JS SDK](https://github.com/GetStream/stream-chat-js) | Browser SDK | MIT License |
| [Google Fonts — DM Serif Display + DM Sans](https://fonts.google.com) | Typography | SIL Open Font License |

---

## Challenges & Solutions

**Challenge**: All free news APIs that require a key either block CORS from production servers (NewsAPI.org) or require paid plans for server-side use.  
**Solution**: The Guardian Open Platform is a genuinely free, production-ready API with CORS support on any domain — ideal for a deployed web app.

**Challenge**: Keeping API keys out of version control while still being easy to configure.  
**Solution**: `config.js` is gitignored; `config.example.js` (a template with placeholders) is committed. Keys are submitted in the assignment comment section.

**Challenge**: Preventing unnecessary API calls when users switch topics quickly.  
**Solution**: In-memory caching (`resCache`) keyed by `query|sort` avoids repeat fetches for the same search, and a `debounce()` delay (400ms) batches rapid keystrokes.
