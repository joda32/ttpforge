import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app import create_app
from app.extensions import db
from app.models.ttp import TTP

TTPS = [
    # Execution
    {"mitre_id": "T1059.001", "name": "PowerShell", "tactic": "Execution", "platform": "Windows", "description": "Adversaries may abuse PowerShell commands and scripts for execution."},
    {"mitre_id": "T1059.003", "name": "Windows Command Shell", "tactic": "Execution", "platform": "Windows", "description": "Adversaries may abuse the Windows command shell for execution."},
    {"mitre_id": "T1059.006", "name": "Python", "tactic": "Execution", "platform": "Windows,Linux,macOS", "description": "Adversaries may abuse Python commands and scripts for execution."},
    # Persistence
    {"mitre_id": "T1053.005", "name": "Scheduled Task", "tactic": "Persistence", "platform": "Windows", "description": "Adversaries may abuse the Windows Task Scheduler to perform task scheduling for initial or recurring execution."},
    {"mitre_id": "T1547.001", "name": "Registry Run Keys / Startup Folder", "tactic": "Persistence", "platform": "Windows", "description": "Adversaries may achieve persistence by adding a program to a startup folder or referencing it with a Registry run key."},
    {"mitre_id": "T1078", "name": "Valid Accounts", "tactic": "Persistence", "platform": "Windows,Linux,macOS,Cloud", "description": "Adversaries may obtain and abuse credentials of existing accounts as a means of gaining Initial Access, Persistence, Privilege Escalation, or Defense Evasion."},
    # Credential Access
    {"mitre_id": "T1003.001", "name": "LSASS Memory", "tactic": "Credential Access", "platform": "Windows", "description": "Adversaries may attempt to access credential material stored in the process memory of the Local Security Authority Subsystem Service (LSASS)."},
    {"mitre_id": "T1110.001", "name": "Password Guessing", "tactic": "Credential Access", "platform": "Windows,Linux,macOS,Cloud", "description": "Adversaries with no prior knowledge of legitimate credentials within the system or environment may guess passwords to attempt access to accounts."},
    {"mitre_id": "T1555.003", "name": "Credentials from Web Browsers", "tactic": "Credential Access", "platform": "Windows,Linux,macOS", "description": "Adversaries may acquire credentials from web browsers by reading files specific to the target browser."},
    # Discovery
    {"mitre_id": "T1083", "name": "File and Directory Discovery", "tactic": "Discovery", "platform": "Windows,Linux,macOS", "description": "Adversaries may enumerate files and directories or may search in specific locations of a host or network share for certain information."},
    {"mitre_id": "T1082", "name": "System Information Discovery", "tactic": "Discovery", "platform": "Windows,Linux,macOS", "description": "An adversary may attempt to get detailed information about the operating system and hardware."},
    {"mitre_id": "T1057", "name": "Process Discovery", "tactic": "Discovery", "platform": "Windows,Linux,macOS", "description": "Adversaries may attempt to get information about running processes on a system."},
    # Lateral Movement
    {"mitre_id": "T1021.001", "name": "Remote Desktop Protocol", "tactic": "Lateral Movement", "platform": "Windows", "description": "Adversaries may use Valid Accounts to log into a computer using the Remote Desktop Protocol (RDP)."},
    {"mitre_id": "T1021.002", "name": "SMB/Windows Admin Shares", "tactic": "Lateral Movement", "platform": "Windows", "description": "Adversaries may use Valid Accounts to interact with a remote network share using Server Message Block (SMB)."},
    {"mitre_id": "T1021.006", "name": "Windows Remote Management", "tactic": "Lateral Movement", "platform": "Windows", "description": "Adversaries may use Valid Accounts to interact with remote systems using Windows Remote Management (WinRM)."},
    # Defense Evasion
    {"mitre_id": "T1055.001", "name": "Dynamic-link Library Injection", "tactic": "Defense Evasion", "platform": "Windows", "description": "Adversaries may inject dynamic-link libraries (DLLs) into processes in order to evade process-based defenses."},
    {"mitre_id": "T1027", "name": "Obfuscated Files or Information", "tactic": "Defense Evasion", "platform": "Windows,Linux,macOS", "description": "Adversaries may attempt to make an executable or file difficult to discover or analyze by encrypting, encoding, or otherwise obfuscating its contents."},
    {"mitre_id": "T1562.001", "name": "Disable or Modify Tools", "tactic": "Defense Evasion", "platform": "Windows,Linux,macOS", "description": "Adversaries may modify and/or disable security tools to avoid possible detection of their malware/tools and activities."},
    # Exfiltration
    {"mitre_id": "T1041", "name": "Exfiltration Over C2 Channel", "tactic": "Exfiltration", "platform": "Windows,Linux,macOS", "description": "Adversaries may steal data by exfiltrating it over an existing command and control channel."},
    {"mitre_id": "T1048.003", "name": "Exfiltration Over Unencrypted Non-C2 Protocol", "tactic": "Exfiltration", "platform": "Windows,Linux,macOS", "description": "Adversaries may steal data by exfiltrating it over an unencrypted network protocol other than that of the existing command and control channel."},
    # Command and Control
    {"mitre_id": "T1071.001", "name": "Web Protocols", "tactic": "Command and Control", "platform": "Windows,Linux,macOS", "description": "Adversaries may communicate using application layer protocols associated with web traffic to avoid detection/network filtering."},
    {"mitre_id": "T1095", "name": "Non-Application Layer Protocol", "tactic": "Command and Control", "platform": "Windows,Linux,macOS", "description": "Adversaries may use an OSI non-application layer protocol for communication between host and C2 server."},
    # Impact
    {"mitre_id": "T1486", "name": "Data Encrypted for Impact", "tactic": "Impact", "platform": "Windows,Linux,macOS", "description": "Adversaries may encrypt data on target systems or on large numbers of systems in a network to interrupt availability to system and network resources."},
    {"mitre_id": "T1490", "name": "Inhibit System Recovery", "tactic": "Impact", "platform": "Windows,Linux,macOS", "description": "Adversaries may delete or remove built-in operating system data and turn off services designed to aid in the recovery of a corrupted system."},
    # Collection
    {"mitre_id": "T1005", "name": "Data from Local System", "tactic": "Collection", "platform": "Windows,Linux,macOS", "description": "Adversaries may search local system sources, such as file systems and configuration files or local databases, to find files of interest and sensitive data."},
]


def seed():
    app = create_app()
    with app.app_context():
        for data in TTPS:
            existing = TTP.query.filter_by(mitre_id=data["mitre_id"]).first()
            if existing:
                for k, v in data.items():
                    setattr(existing, k, v)
            else:
                db.session.add(TTP(**data))
        db.session.commit()
        print(f"Seeded {len(TTPS)} TTPs.")


if __name__ == "__main__":
    seed()
