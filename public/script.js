async function getWeather() {
  const city = document.getElementById('cityInput').value.trim();
  if (!city) return alert('Enter a city name');

  const res = await fetch('/weather', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ city })
  });

  const data = await res.json();

  if (data.error) {
    document.getElementById('result').innerText = data.error;
  } else {
    const now = new Date();
    const timeString = now.toLocaleTimeString();
    
    document.getElementById('result').innerHTML = `
      <h3>Weather in ${data.city}</h3>
      <p>${data.temperature}, ${data.description}</p>
       <p class="time">⏰ Time: ${timeString}</p>
    `;
    
    loadHistory();
  }
}

let isHistoryVisible = false;

function toggleHistory() {
  isHistoryVisible = !isHistoryVisible;
  const section = document.getElementById('historySection');
  section.style.display = isHistoryVisible ? 'block' : 'none';

  const button = document.querySelector('button[onclick="toggleHistory()"]');
  button.textContent = isHistoryVisible ? "❌ Hide History" : "📜 View History";

  if (isHistoryVisible) loadHistory();
}

async function loadHistory() {
  const res = await fetch('/history');
  const history = await res.json();

  const container = document.getElementById('history');
  container.innerHTML = '';

  history.forEach(entry => {
    const div = document.createElement('div');
    div.innerHTML = `
      <p>
        <strong>${entry.city}</strong> - ${entry.temperature} - ${entry.description}
        <small>(${new Date(entry.timestamp).toLocaleString()})</small>
        <button onclick="deleteEntry('${entry.id}')">🗑️ Delete</button>
      </p>
    `;
    container.appendChild(div);
  });
}

async function deleteAllHistory() {
  if (confirm('Are you sure you want to delete all history?')) {
    await fetch('/history', { method: 'DELETE' });
    loadHistory();
  }
}

async function deleteEntry(id) {
  if (!confirm('Delete this entry?')) return;

  const res = await fetch(`/history/${id}`, {
    method: 'DELETE'
  });

  const result = await res.json();
  console.log(result);
  loadHistory();
}
const localTime = new Date(entry.timestamp + "Z").toLocaleString('en-IN', {
  timeZone: 'Asia/Kolkata',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  day: '2-digit',
  month: 'short',
  year: 'numeric'
});
