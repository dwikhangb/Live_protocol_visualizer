from flask import Flask, render_template, request, jsonify
from urllib.parse import urlparse
import time

app = Flask(__name__)


# =========================================================
# HOME PAGE
# =========================================================

@app.route("/")
def home():
    return render_template("index.html")


# =========================================================
# HELPER FUNCTION
# =========================================================

def create_event(protocol, direction, title, message, fields=None):
    """
    Creates one protocol visualization event.
    """

    return {
        "protocol": protocol,
        "direction": direction,
        "title": title,
        "message": message,
        "fields": fields or []
    }


# =========================================================
# BROWSING SIMULATION
# DNS + HTTP
# =========================================================

def simulate_browsing(url):

    if not url.startswith(("http://", "https://")):
        url = "https://" + url

    parsed_url = urlparse(url)

    hostname = parsed_url.hostname or "example.com"
    path = parsed_url.path if parsed_url.path else "/"

    # Simulated IP address
    simulated_ip = "203.0.113.10"

    events = []

    # -----------------------------------------------------
    # DNS QUERY
    # -----------------------------------------------------

    events.append(
        create_event(
            "DNS",
            "client-to-server",
            "DNS Query",
            f"Client asks DNS server for the IP address of {hostname}.",
            [
                ["Query Type", "A"],
                ["Domain", hostname],
                ["Transport", "UDP"],
                ["Port", "53"]
            ]
        )
    )

    # -----------------------------------------------------
    # DNS RESPONSE
    # -----------------------------------------------------

    events.append(
        create_event(
            "DNS",
            "server-to-client",
            "DNS Response",
            f"DNS server returns the simulated IP address {simulated_ip}.",
            [
                ["Answer Type", "A"],
                ["Domain", hostname],
                ["IP Address", simulated_ip],
                ["TTL", "300 seconds"]
            ]
        )
    )

    # -----------------------------------------------------
    # HTTP REQUEST
    # -----------------------------------------------------

    events.append(
        create_event(
            "HTTP",
            "client-to-server",
            "HTTP GET Request",
            f"Client requests {path} from {hostname}.",
            [
                ["Method", "GET"],
                ["Path", path],
                ["Host", hostname],
                ["Version", "HTTP/1.1"],
                ["Connection", "keep-alive"]
            ]
        )
    )

    # -----------------------------------------------------
    # HTTP RESPONSE
    # -----------------------------------------------------

    events.append(
        create_event(
            "HTTP",
            "server-to-client",
            "HTTP Response",
            "Web server sends the requested page to the client.",
            [
                ["Status", "200 OK"],
                ["Content-Type", "text/html"],
                ["Content-Length", "Simulated"],
                ["Server", "Demo Web Server"]
            ]
        )
    )

    return events


# =========================================================
# MAIL SIMULATION
# SMTP
# =========================================================

def simulate_mail(to_address, subject, body):

    sender = "student@example.com"

    events = []

    # -----------------------------------------------------
    # SMTP GREETING
    # -----------------------------------------------------

    events.append(
        create_event(
            "SMTP",
            "server-to-client",
            "SMTP Greeting",
            "Mail server welcomes the client.",
            [
                ["Response", "220 Service Ready"],
                ["Protocol", "SMTP"]
            ]
        )
    )

    # -----------------------------------------------------
    # EHLO
    # -----------------------------------------------------

    events.append(
        create_event(
            "SMTP",
            "client-to-server",
            "EHLO",
            "Client identifies itself to the mail server.",
            [
                ["Command", "EHLO"],
                ["Client", "localhost"]
            ]
        )
    )

    # -----------------------------------------------------
    # SERVER CAPABILITIES
    # -----------------------------------------------------

    events.append(
        create_event(
            "SMTP",
            "server-to-client",
            "SMTP Capabilities",
            "Mail server responds with supported SMTP features.",
            [
                ["Response", "250 OK"],
                ["Feature", "8BITMIME"],
                ["Feature", "STARTTLS"],
                ["Feature", "PIPELINING"]
            ]
        )
    )

    # -----------------------------------------------------
    # MAIL FROM
    # -----------------------------------------------------

    events.append(
        create_event(
            "SMTP",
            "client-to-server",
            "MAIL FROM",
            f"Client specifies the sender address {sender}.",
            [
                ["Command", "MAIL FROM"],
                ["Sender", sender]
            ]
        )
    )

    # -----------------------------------------------------
    # SERVER RESPONSE
    # -----------------------------------------------------

    events.append(
        create_event(
            "SMTP",
            "server-to-client",
            "Sender Accepted",
            "Mail server accepts the sender address.",
            [
                ["Response", "250 OK"],
                ["Status", "Sender accepted"]
            ]
        )
    )

    # -----------------------------------------------------
    # RCPT TO
    # -----------------------------------------------------

    events.append(
        create_event(
            "SMTP",
            "client-to-server",
            "RCPT TO",
            f"Client specifies the recipient {to_address}.",
            [
                ["Command", "RCPT TO"],
                ["Recipient", to_address]
            ]
        )
    )

    # -----------------------------------------------------
    # RECIPIENT ACCEPTED
    # -----------------------------------------------------

    events.append(
        create_event(
            "SMTP",
            "server-to-client",
            "Recipient Accepted",
            "Mail server accepts the recipient address.",
            [
                ["Response", "250 OK"],
                ["Status", "Recipient accepted"]
            ]
        )
    )

    # -----------------------------------------------------
    # DATA COMMAND
    # -----------------------------------------------------

    events.append(
        create_event(
            "SMTP",
            "client-to-server",
            "DATA",
            "Client tells the mail server that the email content is ready.",
            [
                ["Command", "DATA"],
                ["Subject", subject]
            ]
        )
    )

    # -----------------------------------------------------
    # EMAIL BODY
    # -----------------------------------------------------

    events.append(
        create_event(
            "SMTP",
            "client-to-server",
            "Email Content",
            body if body else "(No message body)",
            [
                ["From", sender],
                ["To", to_address],
                ["Subject", subject],
                ["Body", body if body else "(Empty)"]
            ]
        )
    )

    # -----------------------------------------------------
    # MESSAGE ACCEPTED
    # -----------------------------------------------------

    events.append(
        create_event(
            "SMTP",
            "server-to-client",
            "Message Accepted",
            "Mail server accepts the email for delivery.",
            [
                ["Response", "250 OK"],
                ["Status", "Message accepted"],
                ["Queue", "SIMULATED"]
            ]
        )
    )

    # -----------------------------------------------------
    # QUIT
    # -----------------------------------------------------

    events.append(
        create_event(
            "SMTP",
            "client-to-server",
            "QUIT",
            "Client closes the SMTP session.",
            [
                ["Command", "QUIT"]
            ]
        )
    )

    # -----------------------------------------------------
    # GOODBYE
    # -----------------------------------------------------

    events.append(
        create_event(
            "SMTP",
            "server-to-client",
            "SMTP Session Closed",
            "Mail server closes the connection.",
            [
                ["Response", "221 Service Closing"],
                ["Status", "Connection closed"]
            ]
        )
    )

    return events


# =========================================================
# STREAMING SIMULATION
# DNS + HTTP + HLS
# =========================================================

def simulate_streaming(quality):

    hostname = "stream.example.com"
    simulated_ip = "203.0.113.20"

    events = []

    # -----------------------------------------------------
    # DNS QUERY
    # -----------------------------------------------------

    events.append(
        create_event(
            "DNS",
            "client-to-server",
            "DNS Query",
            f"Client asks DNS for the streaming server {hostname}.",
            [
                ["Query Type", "A"],
                ["Domain", hostname],
                ["Transport", "UDP"],
                ["Port", "53"]
            ]
        )
    )

    # -----------------------------------------------------
    # DNS RESPONSE
    # -----------------------------------------------------

    events.append(
        create_event(
            "DNS",
            "server-to-client",
            "DNS Response",
            f"DNS returns the simulated IP address {simulated_ip}.",
            [
                ["Answer Type", "A"],
                ["Domain", hostname],
                ["IP Address", simulated_ip],
                ["TTL", "300 seconds"]
            ]
        )
    )

    # -----------------------------------------------------
    # HLS MASTER PLAYLIST REQUEST
    # -----------------------------------------------------

    events.append(
        create_event(
            "HTTP",
            "client-to-server",
            "HLS Master Playlist Request",
            "Player requests the HLS master playlist.",
            [
                ["Method", "GET"],
                ["Path", "/master.m3u8"],
                ["Host", hostname],
                ["Protocol", "HTTP"]
            ]
        )
    )

    # -----------------------------------------------------
    # HLS MASTER PLAYLIST RESPONSE
    # -----------------------------------------------------

    events.append(
        create_event(
            "HTTP",
            "server-to-client",
            "HLS Master Playlist Response",
            "Server sends available video quality options.",
            [
                ["Status", "200 OK"],
                ["Format", "application/vnd.apple.mpegurl"],
                ["Quality", "360p / 720p / 1080p"]
            ]
        )
    )

    # -----------------------------------------------------
    # MEDIA PLAYLIST REQUEST
    # -----------------------------------------------------

    playlist_path = f"/{quality}/playlist.m3u8"

    events.append(
        create_event(
            "HTTP",
            "client-to-server",
            "Media Playlist Request",
            f"Player requests the {quality} media playlist.",
            [
                ["Method", "GET"],
                ["Path", playlist_path],
                ["Quality", quality]
            ]
        )
    )

    # -----------------------------------------------------
    # MEDIA PLAYLIST RESPONSE
    # -----------------------------------------------------

    events.append(
        create_event(
            "HTTP",
            "server-to-client",
            "Media Playlist Response",
            f"Server returns the {quality} playlist containing video segments.",
            [
                ["Status", "200 OK"],
                ["Quality", quality],
                ["Segments", "3"]
            ]
        )
    )

    # -----------------------------------------------------
    # VIDEO SEGMENTS
    # -----------------------------------------------------

    for number in range(1, 4):

        segment_path = f"/{quality}/segment{number}.ts"

        # Request
        events.append(
            create_event(
                "HTTP",
                "client-to-server",
                f"Video Segment {number} Request",
                f"Player requests video segment {number}.",
                [
                    ["Method", "GET"],
                    ["Path", segment_path],
                    ["Quality", quality],
                    ["Segment", str(number)]
                ]
            )
        )

        # Response
        events.append(
            create_event(
                "HTTP",
                "server-to-client",
                f"Video Segment {number} Response",
                f"Streaming server sends video segment {number}.",
                [
                    ["Status", "200 OK"],
                    ["Content-Type", "video/MP2T"],
                    ["Quality", quality],
                    ["Segment", str(number)]
                ]
            )
        )

    return events


# =========================================================
# API - SIMULATE
# =========================================================

@app.route("/api/simulate", methods=["POST"])
def simulate():

    try:

        data = request.get_json()

        if not data:
            return jsonify({
                "error": "No data received."
            }), 400

        simulation_type = data.get("type")

        # -------------------------------------------------
        # BROWSING
        # -------------------------------------------------

        if simulation_type == "browsing":

            url = data.get("url", "").strip()

            if not url:
                return jsonify({
                    "error": "Please enter a URL."
                }), 400

            events = simulate_browsing(url)

        # -------------------------------------------------
        # MAIL
        # -------------------------------------------------

        elif simulation_type == "mail":

            to_address = data.get("to", "").strip()
            subject = data.get("subject", "").strip()
            body = data.get("body", "").strip()

            if not to_address:
                return jsonify({
                    "error": "Please enter a recipient email address."
                }), 400

            if not subject:
                subject = "(No Subject)"

            events = simulate_mail(
                to_address,
                subject,
                body
            )

        # -------------------------------------------------
        # STREAMING
        # -------------------------------------------------

        elif simulation_type == "streaming":

            quality = data.get("quality", "720p")

            allowed_qualities = [
                "360p",
                "720p",
                "1080p"
            ]

            if quality not in allowed_qualities:
                quality = "720p"

            events = simulate_streaming(quality)

        # -------------------------------------------------
        # UNKNOWN TYPE
        # -------------------------------------------------

        else:

            return jsonify({
                "error": "Unknown simulation type."
            }), 400

        # -------------------------------------------------
        # SEND RESULT
        # -------------------------------------------------

        return jsonify({
            "success": True,
            "events": events,
            "count": len(events)
        })

    except Exception as error:

        print("Simulation error:", error)

        return jsonify({
            "success": False,
            "error": str(error)
        }), 500


# =========================================================
# RUN FLASK SERVER
# =========================================================

if __name__ == "__main__":

    print("=" * 60)
    print(" NETWORK PROTOCOL VISUALIZER")
    print("=" * 60)
    print("Server running at:")
    print("http://127.0.0.1:5000")
    print("=" * 60)

    app.run(
        host="127.0.0.1",
        port=5000,
        debug=True
    )