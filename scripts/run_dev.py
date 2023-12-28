#!/usr/bin/env python3
"""Build React and run ChatterCabin on one local URL."""

import os
import shutil
import signal
import socket
import subprocess
import sys
import time
import webbrowser
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parent.parent
FRONTEND_ROOT = PROJECT_ROOT / "chattercabin_frontend"
FRONTEND_NODE_MODULES = FRONTEND_ROOT / "node_modules"
HOST = "127.0.0.1"
REDIS_PORT = 6379
DJANGO_PORT = 8000
APP_URL = f"http://{HOST}:{DJANGO_PORT}"
processes = []
stop_requested = False


def executable(name):
    found = shutil.which(name)
    if found:
        return found

    for prefix in (Path("/opt/homebrew/bin"), Path("/usr/local/bin")):
        candidate = prefix / name
        if candidate.exists():
            return str(candidate)

    raise RuntimeError(f"Required command is not installed or on PATH: {name}")


def port_is_open(port):
    try:
        with socket.create_connection((HOST, port), timeout=0.25):
            return True
    except OSError:
        return False


def wait_for_port(port, process, timeout=10):
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        if process.poll() is not None:
            raise RuntimeError(
                f"{process.args[0]} exited before port {port} was ready."
            )
        if port_is_open(port):
            return
        time.sleep(0.1)
    raise RuntimeError(f"Timed out waiting for port {port}.")


def start_process(name, command):
    print(f"[ChatterCabin] Starting {name}: {' '.join(command)}", flush=True)
    process_options = {}
    if os.name == "nt":
        process_options["creationflags"] = subprocess.CREATE_NEW_PROCESS_GROUP
    else:
        process_options["start_new_session"] = True

    process = subprocess.Popen(
        command,
        cwd=PROJECT_ROOT,
        env={**os.environ, "PYTHONUNBUFFERED": "1"},
        **process_options,
    )
    processes.append((name, process))
    return process


def terminate_process(name, process):
    if process.poll() is not None:
        return

    print(f"[ChatterCabin] Stopping {name}…", flush=True)
    try:
        if os.name == "nt":
            process.terminate()
        else:
            os.killpg(process.pid, signal.SIGTERM)
        process.wait(timeout=5)
    except ProcessLookupError:
        return
    except subprocess.TimeoutExpired:
        if process.poll() is None:
            try:
                if os.name == "nt":
                    process.kill()
                else:
                    os.killpg(process.pid, signal.SIGKILL)
            except ProcessLookupError:
                pass


def shutdown():
    while processes:
        name, process = processes.pop()
        terminate_process(name, process)


def request_stop(signum, frame):
    del signum, frame
    global stop_requested
    stop_requested = True


def main():
    signal.signal(signal.SIGINT, request_stop)
    signal.signal(signal.SIGTERM, request_stop)

    if port_is_open(DJANGO_PORT):
        raise RuntimeError(
            "Port 8000 is already in use. Stop the existing dev server first."
        )
    if port_is_open(REDIS_PORT):
        raise RuntimeError(
            "Port 6379 is already in use. Stop the existing Redis process so "
            "ChatterCabin can own and shut down its Redis server."
        )

    npm = executable("npm")
    if not FRONTEND_NODE_MODULES.exists():
        print("[ChatterCabin] Installing frontend dependencies…", flush=True)
        subprocess.run(
            [npm, "ci"],
            cwd=FRONTEND_ROOT,
            check=True,
        )

    print("[ChatterCabin] Building React frontend…", flush=True)
    subprocess.run(
        [npm, "run", "build"],
        cwd=FRONTEND_ROOT,
        check=True,
    )

    subprocess.run(
        [sys.executable, "manage.py", "migrate", "--noinput"],
        cwd=PROJECT_ROOT,
        check=True,
    )
    subprocess.run(
        [sys.executable, "manage.py", "reset_room_counts"],
        cwd=PROJECT_ROOT,
        check=True,
    )

    redis = start_process(
        "Redis",
        [
            executable("redis-server"),
            "--bind",
            HOST,
            "--port",
            str(REDIS_PORT),
            "--save",
            "",
            "--appendonly",
            "no",
        ],
    )
    wait_for_port(REDIS_PORT, redis)

    django_command = [
        sys.executable,
        "manage.py",
        "runserver",
        f"{HOST}:{DJANGO_PORT}",
    ]
    if os.name == "nt":
        # Avoid leaving Django's reloader child process behind on Windows.
        django_command.append("--noreload")

    django = start_process("Django", django_command)
    wait_for_port(DJANGO_PORT, django)

    print(f"\n[ChatterCabin] Ready at {APP_URL}", flush=True)
    print(
        "[ChatterCabin] Press Ctrl+C or stop the IDE run to shut down "
        "Django and Redis.\n",
        flush=True,
    )
    if not webbrowser.open(APP_URL, new=2):
        print(f"[ChatterCabin] Open {APP_URL} in your browser.", flush=True)

    while not stop_requested:
        for name, process in processes:
            return_code = process.poll()
            if return_code is not None:
                raise RuntimeError(f"{name} exited unexpectedly ({return_code}).")
        time.sleep(0.25)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        pass
    except Exception as exc:
        print(f"[ChatterCabin] {exc}", file=sys.stderr, flush=True)
        sys.exit_code = 1
    finally:
        shutdown()

    raise SystemExit(getattr(sys, "exit_code", 0))
