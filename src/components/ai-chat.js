import { icons } from './icons.js';
import { askAIAssistant } from '../lib/ai.js';
import { getAuthProfile } from '../lib/auth.js';

export function renderAIChatWidget() {
  const container = document.createElement('div');
  container.className = 'ai-chat-widget';
  
  container.innerHTML = `
    <!-- Floating Button -->
    <button class="ai-chat-btn" id="aiChatToggle" title="Tanya AI Assistant">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z"/>
        <path d="M9 14v-2"/>
        <path d="M15 14v-2"/>
      </svg>
    </button>

    <!-- Chat Panel -->
    <div class="ai-chat-panel" id="aiChatPanel">
      <div class="ai-chat-header">
        <div class="ai-chat-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z"/><path d="M9 14v-2"/><path d="M15 14v-2"/></svg>
          SIMPAH AI Assistant
        </div>
        <button class="ai-chat-close" id="aiChatClose">${icons.close}</button>
      </div>
      <div class="ai-chat-body" id="aiChatMessages">
        <div class="ai-message bot">
          <div class="ai-bubble">Halo! Saya AI Assistant SIMPAH. Apa yang ingin Anda ketahui tentang data persampahan hari ini?</div>
        </div>
      </div>
      <div class="ai-chat-input-area">
        <input type="text" id="aiChatInput" class="ai-input" placeholder="Tanya tentang total sampah..." autocomplete="off"/>
        <button class="ai-send-btn" id="aiChatSend">${icons.checkCircle}</button>
      </div>
    </div>

    <style>
      .ai-chat-widget {
        position: fixed;
        bottom: 24px;
        right: 24px;
        z-index: 9999;
        font-family: var(--font-family, sans-serif);
      }
      .ai-chat-btn {
        width: 56px;
        height: 56px;
        border-radius: 50%;
        background: linear-gradient(135deg, var(--primary-500), var(--primary-600));
        color: white;
        border: none;
        box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.2s, box-shadow 0.2s;
      }
      .ai-chat-btn:hover {
        transform: scale(1.05);
        box-shadow: 0 6px 16px rgba(16, 185, 129, 0.5);
      }
      .ai-chat-panel {
        position: absolute;
        bottom: 70px;
        right: 0;
        width: 340px;
        height: 480px;
        background: var(--bg-primary, #fff);
        border-radius: var(--radius-lg, 12px);
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
        border: 1px solid var(--border-color, #e5e7eb);
        display: none;
        flex-direction: column;
        overflow: hidden;
        transform-origin: bottom right;
        animation: scaleIn 0.2s ease-out;
      }
      .ai-chat-panel.open {
        display: flex;
      }
      .ai-chat-header {
        padding: 16px;
        background: linear-gradient(135deg, var(--primary-600), var(--primary-700));
        color: white;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .ai-chat-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 600;
        font-size: 15px;
      }
      .ai-chat-close {
        background: none;
        border: none;
        color: rgba(255,255,255,0.8);
        cursor: pointer;
        padding: 4px;
      }
      .ai-chat-close:hover { color: white; }
      .ai-chat-body {
        flex: 1;
        padding: 16px;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 12px;
        background: var(--bg-secondary, #f9fafb);
      }
      .ai-message {
        display: flex;
        flex-direction: column;
        max-width: 85%;
      }
      .ai-message.bot { align-self: flex-start; }
      .ai-message.user { align-self: flex-end; }
      .ai-bubble {
        padding: 10px 14px;
        border-radius: 14px;
        font-size: 14px;
        line-height: 1.5;
        word-wrap: break-word;
      }
      .ai-message.bot .ai-bubble {
        background: var(--bg-primary, #fff);
        border: 1px solid var(--border-color, #e5e7eb);
        color: var(--text-primary, #111827);
        border-bottom-left-radius: 4px;
      }
      .ai-message.user .ai-bubble {
        background: var(--primary-500, #10b981);
        color: white;
        border-bottom-right-radius: 4px;
      }
      .ai-chat-input-area {
        padding: 12px;
        background: var(--bg-primary, #fff);
        border-top: 1px solid var(--border-color, #e5e7eb);
        display: flex;
        gap: 8px;
      }
      .ai-input {
        flex: 1;
        padding: 8px 12px;
        border: 1px solid var(--border-color, #e5e7eb);
        border-radius: 20px;
        outline: none;
        font-size: 14px;
        background: var(--bg-secondary, #f9fafb);
        color: var(--text-primary, #111827);
      }
      .ai-input:focus {
        border-color: var(--primary-400);
      }
      .ai-send-btn {
        background: none;
        border: none;
        color: var(--primary-500);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 4px;
      }
      .ai-send-btn:disabled { color: var(--gray-400); cursor: not-allowed; }
      .ai-typing {
        display: flex;
        gap: 4px;
        padding: 12px;
        align-items: center;
      }
      .ai-dot {
        width: 6px;
        height: 6px;
        background: var(--gray-400);
        border-radius: 50%;
        animation: aiBounce 1.4s infinite ease-in-out both;
      }
      .ai-dot:nth-child(1) { animation-delay: -0.32s; }
      .ai-dot:nth-child(2) { animation-delay: -0.16s; }
      @keyframes aiBounce {
        0%, 80%, 100% { transform: scale(0); }
        40% { transform: scale(1); }
      }
      @keyframes scaleIn {
        from { opacity: 0; transform: scale(0.9); }
        to { opacity: 1; transform: scale(1); }
      }
      @media (max-width: 768px) {
        .ai-chat-widget {
          bottom: calc(var(--bottom-nav-height, 64px) + 16px);
          right: 16px;
        }
        .ai-chat-panel {
          bottom: 70px;
          right: 0;
          width: calc(100vw - 32px);
          max-width: 340px;
        }
      }
    </style>
  `;

  document.body.appendChild(container);

  // Logic
  const toggleBtn = container.querySelector('#aiChatToggle');
  const panel = container.querySelector('#aiChatPanel');
  const closeBtn = container.querySelector('#aiChatClose');
  const sendBtn = container.querySelector('#aiChatSend');
  const input = container.querySelector('#aiChatInput');
  const messagesArea = container.querySelector('#aiChatMessages');

  let isSending = false;

  toggleBtn.addEventListener('click', () => {
    panel.classList.toggle('open');
    if (panel.classList.contains('open')) input.focus();
  });

  closeBtn.addEventListener('click', () => panel.classList.remove('open'));

  const appendMessage = (text, role) => {
    const msgDiv = document.createElement('div');
    msgDiv.className = `ai-message ${role}`;
    
    // Escape HTML to prevent truncation
    const safeText = text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    
    // Parse simple markdown
    const formattedText = safeText
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/^### (.*$)/gim, '<h4 style="margin:8px 0 4px">$1</h4>')
      .replace(/^- (.*$)/gim, '<li style="margin-left:16px">$1</li>')
      .replace(/^\d+\. (.*$)/gim, '<li style="margin-left:16px">$1</li>')
      .replace(/\n/g, '<br/>');
      
    msgDiv.innerHTML = `<div class="ai-bubble">${formattedText}</div>`;
    messagesArea.appendChild(msgDiv);
    messagesArea.scrollTop = messagesArea.scrollHeight;
  };

  const showTyping = () => {
    const msgDiv = document.createElement('div');
    msgDiv.className = 'ai-message bot ai-typing-indicator';
    msgDiv.innerHTML = `
      <div class="ai-bubble ai-typing">
        <div class="ai-dot"></div><div class="ai-dot"></div><div class="ai-dot"></div>
      </div>
    `;
    messagesArea.appendChild(msgDiv);
    messagesArea.scrollTop = messagesArea.scrollHeight;
  };

  const removeTyping = () => {
    const typing = messagesArea.querySelector('.ai-typing-indicator');
    if (typing) typing.remove();
  };

  const handleSend = async () => {
    const text = input.value.trim();
    if (!text || isSending) return;

    const user = getAuthProfile();
    const isRestricted = user && !['admin', 'eksekutif'].includes(user.role);

    if (isRestricted) {
      const today = new Date().toISOString().split('T')[0];
      const storageKey = `ai_usage_${user.id}_${today}`;
      const usageCount = parseInt(localStorage.getItem(storageKey) || '0', 10);
      
      if (usageCount >= 5) {
        input.value = '';
        appendMessage(text, 'user');
        showTyping();
        setTimeout(() => {
          removeTyping();
          appendMessage("Maaf, kuota harian Anda telah habis (maksimal 5 pertanyaan per hari untuk role selain Admin & Eksekutif). Kuota akan di-reset besok.", 'bot');
        }, 600);
        return;
      }
      
      localStorage.setItem(storageKey, (usageCount + 1).toString());
    }

    input.value = '';
    isSending = true;
    sendBtn.disabled = true;

    appendMessage(text, 'user');
    showTyping();

    const response = await askAIAssistant(text);

    removeTyping();
    appendMessage(response, 'bot');
    
    isSending = false;
    sendBtn.disabled = false;
    input.focus();
  };

  sendBtn.addEventListener('click', handleSend);
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSend();
  });
}
