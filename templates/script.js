const gearIcon = document.querySelector('.gear-icon');
const modal = document.querySelector('.advanced-options-modal');
const closeButton = document.querySelector('.close');

gearIcon.addEventListener('click', () => {
  modal.style.display = 'block';
});

closeButton.addEventListener('click', () => {
  modal.style.display = 'none';
});

window.addEventListener('click', (event) => {
  if (event.target === modal) {
    modal.style.display = 'none';
  }
});



const messageInput = document.querySelector('.chat-input textarea');
const sendButton = document.querySelector('.chat-input button');
const urlInput = document.querySelector('#url');

sendButton.addEventListener('click', () => {
  const message = messageInput.value.trim();
  if (message !== '') {
    addMessage('user', message);
    sendMessageToServer([
      {
        role: 'user',
        content: message
      }
    ]);
    messageInput.value = '';
  }
});

function setCookie(name, value, days) {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
}

function getCookie(name) {
  const keyValue = document.cookie.match(`(^|;) ?${name}=([^;]*)(;|$)`);
  return keyValue ? keyValue[2] : null;
}

let storedUrl = getCookie('storedUrl') || ':4000/chat';
urlInput.value = storedUrl;

urlInput.addEventListener('change', () => {
  storedUrl = urlInput.value.trim();
  setCookie('storedUrl', storedUrl, 30);
});

function addMessage(type, text, completionTokens) {
  const messageElement = document.createElement('div');
  messageElement.classList.add('message', type);

  const textElement = document.createElement('div');
  textElement.classList.add('text');
  textElement.innerHTML = DOMPurify.sanitize(marked.parse(text));
  messageElement.appendChild(textElement);

  if (type === 'assistant') {
    const completionTokensElement = document.createElement('div');
    completionTokensElement.classList.add('completion-tokens');
    completionTokensElement.textContent = `Completion Tokens: ${completionTokens}`;
    messageElement.appendChild(completionTokensElement);
  }

  const chatMessages = document.querySelector('.chat-messages');
  chatMessages.appendChild(messageElement);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function sendMessageToServer(messages) {
  const url = urlInput.value.trim();
  const previousMessages = document.querySelectorAll('.message');
  const allMessages = [];
  previousMessages.forEach(message => {
    const role = message.classList.contains('user') ? 'user' : 'assistant';
    const content = message.querySelector('.text').textContent.trim();
    const messageObj = { role, content };
    if (!allMessages.some(existingMsg => existingMsg.content === messageObj.content)) {
      allMessages.push(messageObj);
    }
  });
  messages.forEach(message => {
    if (!allMessages.some(existingMsg => existingMsg.content === message.content)) {
      allMessages.push(message);
    }
  });

  const temp = parseFloat(document.getElementById('tempSlider').value);

  console.log('Sending messages:', allMessages, 'to URL:', url, 'with temperature:', temp);
  fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messages: allMessages,
      temp: temp
    }),
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return response.json();
  })
  .then(data => {
    console.log('Server response:', data);
    addMessage('assistant', data.content[0], data.usage.completion_tokens);
  })
  .catch(error => {
    console.error('There was a problem with your fetch operation:', error);
  });
}



document.addEventListener('DOMContentLoaded', () => {
  const chatMessages = document.querySelector('.chat-messages');

  chatMessages.addEventListener('mouseover', (event) => {
    const messageElement = event.target.closest('.message');
    if (messageElement) {
      const completionTokens = messageElement.dataset.completionTokens;
      if (completionTokens) {
        const tooltip = document.createElement('div');
        tooltip.classList.add('tooltip');
        tooltip.textContent = `Completion Tokens: ${completionTokens}`;
        messageElement.appendChild(tooltip);
      }
    }
  });

  chatMessages.addEventListener('mouseout', (event) => {
    const tooltip = event.target.querySelector('.tooltip');
    if (tooltip) {
      tooltip.remove();
    }
  });
});

const tempSlider = document.getElementById('tempSlider');
const tempValue = document.getElementById('tempValue');

tempSlider.addEventListener('input', function() {
  tempValue.textContent = tempSlider.value;
});