// Initialize Google API client
function initClient() {
  gapi.load('client:auth2', () => {
    gapi.client.init({
      apiKey: 'YOUR_API_KEY',
      clientId: 'YOUR_CLIENT_ID.apps.googleusercontent.com',
      discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
      scope: 'https://www.googleapis.com/auth/drive.file'
    });
  });
}

// Upload file to Google Drive
async function uploadToDrive(file) {
  const metadata = { name: file.name, mimeType: file.type };
  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', file);

  const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: new Headers({ 'Authorization': 'Bearer ' + gapi.auth.getToken().access_token }),
    body: form
  });
  return await res.json();
}

// Handle form submission
const form = document.getElementById('uploadForm');
const docList = document.getElementById('docList');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const title = form.title.value;
  const description = form.description.value;
  const ballInCourt = form.ballInCourt.value;
  const file = form.file.files[0];

  // Upload to Google Drive
  const uploaded = await uploadToDrive(file);
  const fileLink = `https://drive.google.com/file/d/${uploaded.id}/view?usp=sharing`;

  // Determine initial status based on workflow
  let status = 'Sub'; // default Submitted
  let nextBallInCourt = 'DC'; // after Engineer submits, DC gets it

  if (ballInCourt === 'DC') {
    status = 'TR'; // Transmitted
    nextBallInCourt = 'WTA';
  } else if (ballInCourt === 'WTA') {
    status = 'A'; // Approved (or ASC)
    nextBallInCourt = 'Engineer';
  }

  // Add row to table
  const row = `
    <tr>
      <td>${Math.floor(Math.random() * 10000)}</td>
      <td>${title}</td>
      <td>D</td>
      <td><span class="status-${status}">${status}</span></td>
      <td>${nextBallInCourt}</td>
      <td><a href="${fileLink}" target="_blank">View File</a></td>
    </tr>`;
  docList.insertAdjacentHTML('beforeend', row);
  form.reset();
});

initClient();
