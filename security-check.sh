#!/bin/bash
# Security audit script

echo "=========================================="
echo "🔒 SECURITY AUDIT - $(date)"
echo "=========================================="

echo ""
echo "1. Checking for known malware processes..."
ps aux | grep -E 'linuxsys|fghgf|stink|xmrig|kdevtmpfsi|kinsing|minergate' | grep -v grep && echo "⚠️ SUSPICIOUS PROCESSES FOUND!" || echo "✅ No malware processes"

echo ""
echo "2. Checking cron jobs..."
echo "--- Root crontab ---"
crontab -l 2>/dev/null || echo "(empty)"
echo "--- /etc/crontab ---"
cat /etc/crontab | grep -v "^#" | grep -v "^$"
echo "--- /etc/cron.d/ ---"
ls -la /etc/cron.d/

echo ""
echo "3. Checking for suspicious files in /tmp..."
ls -la /tmp/ | grep -E '\.sh$|curl|wget|linuxsys|fghgf|stink' && echo "⚠️ SUSPICIOUS FILES IN /TMP!" || echo "✅ /tmp looks clean"

echo ""
echo "4. Checking outbound connections..."
ss -tunp | grep ESTAB | grep -v '127.0.0.1' | head -20

echo ""
echo "5. Checking for suspicious network connections to known malicious IPs..."
ss -tunp | grep -E '5.255.121.141|37.114.37.94|37.114.37.82' && echo "⚠️ CONNECTIONS TO MALICIOUS IPS!" || echo "✅ No connections to known malicious IPs"

echo ""
echo "6. Checking firewall rules for blocked IPs..."
iptables -L OUTPUT -n | grep -E '5.255.121.141|37.114.37.94|37.114.37.82' && echo "✅ Malicious IPs are blocked" || echo "⚠️ Malicious IP blocking rules not found"

echo ""
echo "7. Checking SSH authorized_keys..."
echo "--- /root/.ssh/authorized_keys ---"
cat /root/.ssh/authorized_keys | head -5
echo "(showing first 5 entries)"

echo ""
echo "8. Checking for unusual systemd services..."
systemctl list-units --type=service --state=running | grep -v -E 'docker|nginx|postgres|ssh|cron|systemd|dbus|getty|network|journal|snap|udev|polkit|rsyslog|containerd|fail2ban|unattended' | head -20

echo ""
echo "9. Checking shell startup files for persistence..."
grep -l 'curl\|wget\|base64' /root/.bashrc /root/.profile /etc/profile /etc/bash.bashrc 2>/dev/null && echo "⚠️ SUSPICIOUS ENTRIES IN SHELL STARTUP!" || echo "✅ Shell startup files clean"

echo ""
echo "10. Checking Docker containers..."
docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Command}}" | head -15

echo ""
echo "11. Checking Next.js version..."
grep '"next":' /root/healthscribe-build/package.json

echo ""
echo "12. Testing website accessibility..."
curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" -m 5 http://localhost:3000/

echo ""
echo "=========================================="
echo "🔒 SECURITY AUDIT COMPLETE"
echo "=========================================="
