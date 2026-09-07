import os
import streamlit as st
import requests
import time
import uuid
import base64
import logfire
from dotenv import load_dotenv


# Load environment variables explicitly from the root directory
env_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".env"))
load_dotenv(dotenv_path=env_path)


# Initialize Logfire
try:
    token = os.getenv("LOGFIRE_TOKEN")
    if token:
        logfire.configure(token=token, inspect_arguments=False)
    else:
        logfire.configure(send_to_logfire=False, inspect_arguments=False)
    LOGFIRE_STATUS = "Connected & Tracing"
except Exception as e:
    print(f"Logfire Init Error in UI: {e}")
    LOGFIRE_STATUS = f"Standby (Error: {e})"


# --- PAGE CONFIG ---
st.set_page_config(
    page_title="Claude",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Load Generative Tree background HTML as base64
tree_html_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "generative-tree.html"))
tree_base64 = ""
if os.path.exists(tree_html_path):
    with open(tree_html_path, "r", encoding="utf-8") as f:
        tree_base64 = base64.b64encode(f.read().encode("utf-8")).decode("utf-8")

# --- GENERATIVE TREE BACKGROUND + CLAUDE MINIMALIST STYLING ---
custom_css = f"""
<style>
/* Hide default Streamlit header bar & padding */
header[data-testid="stHeader"] {{
    background: transparent !important;
    height: 40px !important;
}}

/* Main app background */
.stApp {{
    background-color: #0a0a0a !important;
    color: #e3e3e3 !important;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
}}

/* Generative Tree Canvas Iframe Background */
.tree-bg-iframe {{
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    border: none;
    z-index: 0;
    pointer-events: none;
    opacity: 0.65;
}}

/* Main view padding adjustment & z-index */
.main .block-container {{
    position: relative;
    z-index: 2;
    padding-top: 1rem !important;
    padding-bottom: 2rem !important;
    max-width: 840px !important;
}}

/* Sidebar styling - exact Claude dark sidebar with backdrop blur */
[data-testid="stSidebar"] {{
    background-color: rgba(18, 18, 18, 0.88) !important;
    backdrop-filter: blur(16px) !important;
    border-right: 1px solid rgba(255, 255, 255, 0.07) !important;
    z-index: 10 !important;
}}

[data-testid="stSidebar"] [data-testid="stMarkdownContainer"] p {{
    color: #999999 !important;
    font-size: 0.88rem !important;
}}

/* Navigation Bar items styling */
.nav-section {{
    margin-bottom: 18px;
}}

.nav-item {{
    display: flex;
    align-items: center;
    padding: 8px 10px;
    margin-bottom: 2px;
    border-radius: 6px;
    color: #b0b0b0;
    font-size: 0.88rem;
    cursor: pointer;
    transition: background 0.15s ease;
}}

.nav-item:hover {{
    background-color: rgba(255, 255, 255, 0.05);
    color: #f0f0f0;
}}

.nav-section-title {{
    font-size: 0.76rem;
    font-weight: 500;
    color: #777777;
    margin-top: 20px;
    margin-bottom: 8px;
    padding-left: 8px;
    letter-spacing: 0.3px;
    text-transform: uppercase;
}}

.chat-history-item {{
    padding: 7px 10px;
    margin-bottom: 2px;
    border-radius: 6px;
    color: #8e8e8e;
    font-size: 0.84rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    cursor: pointer;
    transition: all 0.15s ease;
}}

.chat-history-item:hover {{
    background-color: rgba(255, 255, 255, 0.05);
    color: #d8d8d8;
}}

.chat-history-item.active {{
    background-color: rgba(255, 255, 255, 0.08);
    color: #ffffff;
}}

/* Claude-style Hero Header */
.hero-title {{
    text-align: center;
    margin-top: 60px;
    margin-bottom: 12px;
    font-size: 2.3rem;
    font-weight: 400;
    color: #f0f0f0;
    letter-spacing: -0.5px;
    text-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
}}

.hero-subtitle {{
    text-align: center;
    color: #a0a0a0;
    font-size: 0.92rem;
    margin-bottom: 45px;
    text-shadow: 0 1px 6px rgba(0, 0, 0, 0.5);
}}

/* Chat message bubbles - sleek dark translucent panels */
[data-testid="stChatMessage"] {{
    background-color: rgba(24, 24, 24, 0.82) !important;
    border: 1px solid rgba(255, 255, 255, 0.08) !important;
    border-radius: 14px !important;
    padding: 16px 20px !important;
    margin-bottom: 14px !important;
    backdrop-filter: blur(12px) !important;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.35) !important;
}}

/* User chat message styling */
[data-testid="stChatMessage"]:has([data-testid="stChatMessageAvatarUser"]) {{
    background-color: rgba(34, 30, 26, 0.85) !important;
    border: 1px solid rgba(218, 119, 86, 0.25) !important;
}}

/* Fix bottom chat input container background color mismatch */
[data-testid="stBottom"],
[data-testid="stBottom"] > div,
[data-testid="stChatInputContainer"],
.stChatInputContainer,
footer {{
    background: transparent !important;
    background-color: transparent !important;
    box-shadow: none !important;
    border: none !important;
}}

/* Chat Input Bar - Claude floating rounded box */
[data-testid="stChatInput"] {{
    border-radius: 18px !important;
    background-color: rgba(28, 28, 28, 0.92) !important;
    border: 1px solid rgba(255, 255, 255, 0.15) !important;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5) !important;
    backdrop-filter: blur(12px) !important;
}}

[data-testid="stChatInput"] textarea {{
    color: #f0f0f0 !important;
    background: transparent !important;
}}

[data-testid="stChatInput"]:focus-within {{
    border-color: rgba(255, 255, 255, 0.3) !important;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6) !important;
}}

/* Status and Expander styling */
[data-testid="stExpander"], [data-testid="stStatusWidget"] {{
    background-color: rgba(22, 22, 22, 0.85) !important;
    border: 1px solid rgba(255, 255, 255, 0.08) !important;
    border-radius: 12px !important;
    backdrop-filter: blur(10px) !important;
}}

/* Buttons - Claude card style */
.stButton button {{
    background-color: rgba(28, 28, 28, 0.75) !important;
    border: 1px solid rgba(255, 255, 255, 0.12) !important;
    border-radius: 10px !important;
    color: #cccccc !important;
    font-size: 0.88rem !important;
    font-weight: 400 !important;
    padding: 10px 14px !important;
    transition: all 0.2s ease-in-out !important;
    width: 100% !important;
    text-align: left !important;
    backdrop-filter: blur(8px) !important;
}}

.stButton button:hover {{
    background-color: rgba(45, 45, 45, 0.9) !important;
    border-color: rgba(255, 255, 255, 0.25) !important;
    color: #ffffff !important;
}}
</style>
"""

st.markdown(custom_css, unsafe_allow_html=True)

# Render Generative Tree iframe background
if tree_base64:
    st.markdown(f'<iframe src="data:text/html;base64,{tree_base64}" class="tree-bg-iframe"></iframe>', unsafe_allow_html=True)


# --- SESSION MANAGEMENT ---
if "session_id" not in st.session_state:
    st.session_state.session_id = str(uuid.uuid4())
    logfire.info(f"New User Session Created: {st.session_state.session_id}")

if "messages" not in st.session_state:
    st.session_state.messages = []

if "history_threads" not in st.session_state:
    st.session_state.history_threads = [
        "Technical Architecture & Pipeline",
        "Vector Search & Qdrant Pipeline",
        "NeMo Guardrails Configuration",
        "RAGAS Evaluation Suite"
    ]


# --- SIDEBAR NAVIGATION (CLAUDE LAYOUT) ---
with st.sidebar:
    # Header: App Title
    st.markdown("<h3 style='margin-bottom: 12px; font-weight: 500;'>Claude</h3>", unsafe_allow_html=True)
    
    # Primary Action: + New Chat
    if st.button("+ New chat", use_container_width=True):
        logfire.warn(f"New Chat Session Started for session: {st.session_state.session_id}")
        st.session_state.messages = []
        st.session_state.session_id = str(uuid.uuid4())
        st.rerun()

    st.markdown(
        """
        <div class="nav-section">
            <div class="nav-item">Projects</div>
            <div class="nav-item">Artifacts</div>
            <div class="nav-item">Code</div>
            <div class="nav-item">Customize</div>
        </div>
        
        <div class="nav-section-title">Chats and tasks</div>
        """,
        unsafe_allow_html=True
    )
    
    # Active & Recent Threads
    current_title = "Current Conversation" if st.session_state.messages else "New Session"
    st.markdown(f'<div class="chat-history-item active">{current_title}</div>', unsafe_allow_html=True)
    for title in st.session_state.history_threads:
        st.markdown(f'<div class="chat-history-item">{title}</div>', unsafe_allow_html=True)
        
    st.markdown("<br><hr style='border-color: rgba(255,255,255,0.08);'><br>", unsafe_allow_html=True)
    
    st.caption(f"Logfire Status: **{LOGFIRE_STATUS}**")
    st.caption(f"Memory ID: `{st.session_state.session_id[:8]}`")
    st.markdown("<div style='margin-top: 15px; font-size: 0.85rem; color: #888888;'>honours • Free</div>", unsafe_allow_html=True)


# --- MAIN TOP NAVBAR ---
st.markdown(
    """
    <div style="display: flex; justify-content: flex-end; align-items: center; margin-bottom: 10px;">
        <div style="background-color: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 16px; padding: 5px 14px; font-size: 0.8rem; color: #999999;">
            Free plan • <span style="color: #e0e0e0; cursor: pointer; text-decoration: underline;">Upgrade</span>
        </div>
    </div>
    """,
    unsafe_allow_html=True
)


# --- MAIN HERO / CHAT ---
if not st.session_state.messages:
    st.markdown(
        """
        <div class="hero-title">
            What shall we think through?
        </div>
        <div class="hero-subtitle">
            Enterprise Agentic RAG Assistant • LangGraph Reasoning • Portkey Gateway
        </div>
        """,
        unsafe_allow_html=True
    )
    
    # Suggestion Cards Grid (Claude style)
    col1, col2 = st.columns(2)
    prompt_to_send = None
    
    with col1:
        if st.button("Technical Architecture & Pipeline", use_container_width=True):
            prompt_to_send = "Explain the technical architecture and pipeline of this Enterprise RAG system."
        if st.button("Qdrant Vector Search & Reranking", use_container_width=True):
            prompt_to_send = "How does vector search with Qdrant and FlashRank reranking work in this project?"
            
    with col2:
        if st.button("NeMo Guardrails & Safety Checks", use_container_width=True):
            prompt_to_send = "What input and output guardrails are configured via NeMo Guardrails?"
        if st.button("Evaluation Metrics & Suite", use_container_width=True):
            prompt_to_send = "Summarize the RAGAS evaluation pipeline and available evaluation metrics."
            
    if prompt_to_send:
        st.session_state.messages.append({"role": "user", "content": prompt_to_send})
        st.rerun()

else:
    st.markdown("<h4 style='margin-bottom: 20px; font-weight: 400;'>Enterprise Agentic Assistant</h4>", unsafe_allow_html=True)


# Display chat history
for message in st.session_state.messages:
    avatar = None
    with st.chat_message(message["role"], avatar=avatar):
        st.markdown(message["content"])

# Chat Input
if prompt := st.chat_input("How can I help you today?"):
    # START TRACE: User Interaction
    with logfire.span("User Chat Interaction", user_query=prompt, session_id=st.session_state.session_id):
        
        st.session_state.messages.append({"role": "user", "content": prompt})
        with st.chat_message("user", avatar=None):
            st.markdown(prompt)

        # Assistant Response
        with st.chat_message("assistant", avatar=None):
            with st.status("Agent is thinking...", expanded=True) as status:
                try:
                    # DISTRIBUTED TRACE: Calling Backend
                    with logfire.span("Calling RAG Backend"):
                        # Get backend URL from env, or default to local if not set
                        base_url = os.getenv("BACKEND_URL", "http://localhost:8000")
                        url = f"{base_url}/query"
                        payload = {"q": prompt, "thread_id": st.session_state.session_id}
                        response = requests.post(url, json=payload, timeout=60)
                        data = response.json()
                    
                    # Show Reasoning Steps from Backend
                    steps = data.get("thought_process", [])
                    for step in steps:
                        st.write(step)
                    
                    status.update(label="Answer Synthesized", state="complete", expanded=False)
                    
                    # --- SHOW SOURCES (NESTED EXPANDABLES) ---
                    sources = data.get("sources", [])
                    if sources:
                        with st.expander("View Retrieved Context (Sources)"):
                            for i, source in enumerate(sources):
                                # Create a preview title for each chunk
                                preview = source[:100].replace("\n", " ") + "..."
                                with st.expander(f"Chunk {i+1}: {preview}"):
                                    st.info(source)
                except Exception as e:
                    logfire.error(f"UI-Backend Connection Failed: {e}")
                    status.update(label="Connection Failed", state="error")
                    st.error("Backend Offline.")
                    st.stop()

            # Final Answer Streaming
            answer_placeholder = st.empty()
            full_answer = data.get("answer", "No response.")
            
            curr_text = ""
            for char in full_answer:
                curr_text += char
                answer_placeholder.markdown(curr_text + "▌")
                time.sleep(0.005)
            
            answer_placeholder.markdown(full_answer)
            st.session_state.messages.append({"role": "assistant", "content": full_answer})
            logfire.info("Chat cycle completed successfully.")
