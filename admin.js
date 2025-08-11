const jsonUrl = 'https://URL.DE.TON.JSON/users1.json'; // On changera ensuite

let users = [];

async function fetchUsers() {
  const res = await fetch(jsonUrl);
  users = await res.json();
  displayUsers();
}

function displayUsers() {
  const list = document.getElementById('userList');
  list.innerHTML = '';
  users.forEach((user, index) => {
    const li = document.createElement('li');
    li.innerHTML = `${user} <button onclick="removeUser(${index})">❌</button>`;
    list.appendChild(li);
  });
}

function addUser() {
  const newUser = document.getElementById('user').value.trim().toLowerCase();
  if (newUser && !users.includes(newUser)) {
    users.push(newUser);
    displayUsers();
    // Il faudra ajouter ici la sauvegarde dans un backend sécurisé (à venir)
  }
}

function removeUser(index) {
  users.splice(index, 1);
  displayUsers();
  // Idem : ajouter sauvegarde sécurisée ensuite
}

fetchUsers();
