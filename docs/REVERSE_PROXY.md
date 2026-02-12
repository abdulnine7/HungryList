# Reverse Proxy Recommendations

HungryList is designed to run as a local container and can be safely exposed with a reverse proxy.

## Required Backend Env

Set these when using a reverse proxy:

- `TRUST_PROXY=true`
- `COOKIE_SECURE=true`

## Caddy Example

```caddyfile
hungrylist.example.com {
  encode gzip
  reverse_proxy hungrylist:8080 {
    header_up X-Forwarded-Proto {scheme}
    header_up X-Forwarded-For {remote_host}
    header_up X-Forwarded-Host {host}
  }
}
```

## Nginx Example

```nginx
server {
  listen 443 ssl http2;
  server_name hungrylist.example.com;

  ssl_certificate /etc/letsencrypt/live/hungrylist.example.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/hungrylist.example.com/privkey.pem;

  location / {
    proxy_pass http://hungrylist:8080;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Host $host;
  }
}
```

## Cloudflare + Local TrueNAS Pattern

1. Keep HungryList bound to local network only.
2. Expose through Cloudflare tunnel/reverse proxy policy.
3. Enforce Cloudflare access/firewall rules.
4. Keep TrueNAS host firewall restricted to trusted LAN segments.
