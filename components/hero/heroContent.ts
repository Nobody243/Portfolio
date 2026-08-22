/**
 * Every string the hero renders, in one place — the single source for both the
 * DOM layer and the command sphere on the canvas.
 *
 * This is content, not configuration. Do not edit it to fit a layout.
 */

/**
 * The <h1>. `sr-only` in the live layout, visible only in `HeroHeadline`'s
 * fallback arrangement.
 *
 * IT IS NOW THE ONLY PLACE THE NAME EXISTS IN THE HERO'S OWN DOM, and that is
 * deliberate rather than an oversight left by deleting the SAAD wordmark. The
 * Intro delivers "Muhammad Saad" at full size and reduces it to the MS mark, so
 * the name arrives as a move rather than as a static headline, and the mark the
 * navbar carries is what holds it afterwards. (This read "contracts it into the
 * navbar's MS mark". The reduction happens on the Intro's own plate; the
 * navbar's instance slides in separately.) A second visible
 * wordmark in the hero would restate what the Intro just spent 1.6 seconds
 * saying.
 */
export const HERO_NAME = "Muhammad Saad";

/**
 * The identity statement, split into its two stagger units.
 *
 * THE SPLIT IS SEMANTIC, NOT VISUAL — do not re-balance it for line length:
 *   - unit 1 is the stance, unit 2 is the destination;
 *   - breaking after "building" would strand "toward" and leave "Engineer
 *     building" reading as an unfinished thought;
 *   - "cybersecurity & cloud." is the entire positioning of the site, and on
 *     its own line it lands with weight instead of trailing off the end of a
 *     sentence.
 *
 * Rendered as two stacking block elements, never a <br>: a <br> cannot reflow
 * on a narrow phone, cannot carry per-unit stagger timing, and cannot be
 * wrapped in the per-unit overflow-hidden box the masked reveal requires.
 *
 * The unit count stays 2 even if a unit reflows internally at 360px.
 */
export const HERO_TAGLINE_UNITS = [
  "Engineer building toward",
  "cybersecurity & cloud.",
] as const;

/** Joined form, for anywhere the statement is needed as one string. */
export const HERO_TAGLINE = HERO_TAGLINE_UNITS.join(" ");

/**
 * The hero section's DOM id.
 *
 * IT IS AN ANCHOR, NOT DECORATION, and it now has two consumers outside the
 * hero: the navbar's centre control scrolls to it, and the navbar's adaptive
 * palette is driven by a ScrollTrigger bound to it. It lives in this module
 * rather than being exported from `Hero.tsx` so that importing the id does not
 * drag the whole client component — canvas, SVG rig and all — into the
 * importer's chunk.
 *
 * Renaming it breaks both of those silently: `getElementById` returns null and
 * the ScrollTrigger simply never fires, with nothing logged.
 */
export const HERO_SECTION_ID = "hero";

/**
 * The command sphere's fragments.
 *
 * EVERY ONE IS A REAL, SYNTACTICALLY VALID INVOCATION — most of them the
 * leading clause of one, which is what a "fragment" is here. This site's whole
 * positioning rests on not fabricating technical claims, and a wrong flag on an
 * `nmap` line is exactly what the intended reader catches first. Check any edit
 * against the tool's actual man page before it ships; nothing in the build can
 * catch a malformed one.
 *
 * OFFENSIVE TOOLING IS DELIBERATELY ABSENT. No credential crackers, no
 * exploitation frameworks. Saad has not claimed that work and a portfolio
 * pivoting toward security must not imply it. The set is infrastructure,
 * networking, cloud and security OPERATIONS.
 *
 * THE `git`, `docker` AND `curl` ENTRIES ARE DELIBERATE — do not purge them for
 * thematic tidiness. A pure-infra set would overclaim the pivot; this mix reads
 * as "builds things, heading toward infrastructure", which is the actual
 * positioning. The dev-side lines are the honest half of that sentence.
 *
 * NO REAL HOSTS. Any address here must stay inside RFC 1918 or a documentation
 * range, so nothing on the page reads as pointing at something live.
 *
 * Grouped by tool family for editing. The renderer does not depend on the
 * order — it samples across the list by stride when it needs fewer than all of
 * them, precisely so the grouping never turns a small sphere into one family.
 */
export const HERO_COMMAND_FRAGMENTS = [
  // Kubernetes / orchestration
  "kubectl apply -f",
  "kubectl get pods -A",
  "kubectl logs -f",
  "kubectl describe node",
  "kubectl rollout status",
  "kubectl exec -it",
  "kubectl port-forward",
  "kubectl top pods",
  "kubectl drain",
  "helm upgrade --install",

  // Infrastructure as code
  "terraform plan",
  "terraform apply",
  "terraform init",
  "terraform fmt -check",
  "terraform state list",
  "terraform validate",
  "ansible-playbook -i",
  "vault kv get",

  // Containers
  "docker ps -a",
  "docker build -t",
  "docker compose up -d",
  "docker logs -f",
  "docker exec -it",
  "docker image prune",
  "docker network ls",
  "docker stats",

  // Network analysis
  "nmap -sV 10.0.0.1",
  "nmap -sS -p-",
  "tcpdump -i eth0",
  "tcpdump -nn port 443",
  "wireshark -k",
  "netstat -tulpn",
  "ss -tlnp",
  "dig +short",
  "nslookup",
  "traceroute",
  "ping -c 4",
  "ip addr show",
  "ip route add",
  "arp -a",
  "whois",
  "mtr --report",

  // Firewalling
  "iptables -A INPUT",
  "iptables -L -n -v",
  "ufw enable",
  "ufw allow 22/tcp",
  "firewall-cmd --reload",
  "nft list ruleset",

  // SSH / TLS / crypto
  "ssh root@",
  "ssh-keygen -t ed25519",
  "ssh-copy-id",
  "scp -r",
  "sftp",
  "ssh -L 8080:",
  "openssl req -x509",
  "openssl s_client -connect",
  "openssl x509 -noout -text",
  "certbot renew",
  "gpg --verify",

  // Cloud
  "aws s3 sync",
  "aws ec2 describe-instances",
  "aws iam list-roles",
  "aws sts get-caller-identity",
  "aws logs tail",
  "gcloud compute instances list",
  "az vm list",

  // Linux / systemd
  "systemctl restart",
  "systemctl status",
  "systemctl enable --now",
  "journalctl -u",
  "journalctl -xe",
  "crontab -e",
  "chmod 700",
  "chown -R",
  "umask 077",
  "useradd -m",
  "usermod -aG",
  "passwd",
  "lsof -i",
  "ps aux",
  "top -b -n 1",
  "df -h",
  "du -sh",
  "free -m",
  "tail -f /var/log",
  "grep -r",
  "sed -i",
  "find . -type f",
  "rsync -avz",
  "tar -czf",

  // HTTP / dev
  "curl -X POST",
  "wget -qO-",
  "git push origin main",
  "git rebase -i",
  "git log --oneline",
] as const;

/**
 * The fragments that must land in the sphere's FRONT hemisphere at its rest
 * orientation.
 *
 * THIS EXISTS FOR THE REDUCED-MOTION VISITOR. That path draws exactly one frame
 * and never draws another, so the single frame they get has to open with
 * commands that are immediately recognisable as real tooling rather than with
 * whatever the golden-angle spiral happened to place there. Four is enough to
 * fill the front-centre band at the rest angles without crowding it.
 *
 * Every entry must also appear in HERO_COMMAND_FRAGMENTS; one that does not is
 * silently ignored rather than drawn twice.
 */
export const HERO_COMMAND_FEATURED = [
  "kubectl apply -f",
  "terraform plan",
  "nmap -sV 10.0.0.1",
  "docker ps -a",
] as const;

/**
 * The sphere's one line of accessible text, rendered `sr-only` after the
 * tagline.
 *
 * ONE SENTENCE, NOT NINETY STRINGS. Piping the fragment list into the
 * accessibility tree would hand a screen-reader user an unstructured word salad
 * before they ever reach the positioning statement — the audio equivalent of
 * the visual noise this design spends its whole budget avoiding. The commands
 * carry their meaning from being ARRANGED ON A SPHERE, which is a purely visual
 * relationship that does not survive being read aloud.
 *
 * AND NOT NOTHING EITHER. `Skills.tsx` records that hiding a device with
 * nothing in its place was the actual bug there, not the hiding; the same trap
 * applies to leaving silence where the site's one spectacle beat is.
 *
 * IT DESCRIBES, IT DOES NOT CLAIM. "Commands from the tools he uses daily"
 * would be an overclaim — the pivot toward this work is deliberate and still
 * ahead of him. Naming the direction is the honest version. Do not extend this
 * into a capability statement.
 */
export const HERO_SPHERE_DESCRIPTION =
  "A slowly rotating sphere of terminal commands from cloud, networking and security tooling.";
