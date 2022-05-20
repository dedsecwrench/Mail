document.addEventListener("DOMContentLoaded", function () {
  // Use buttons to toggle between views
  document.querySelector("#inbox").addEventListener("click", () => load_mailbox("inbox"));
  document.querySelector("#sent").addEventListener("click", () => load_mailbox("sent"));
  document.querySelector("#archived").addEventListener("click", () => load_mailbox("archive"));
  document.querySelector("#compose").addEventListener("click", compose_email);
  document.querySelector("#compose-form").addEventListener("submit", send_email);
  // By default, load the inbox
  load_mailbox("inbox");
});

function compose_email() {
  // Show compose view and hide other views
  document.querySelector("#emails-view").style.display = "none";
  document.querySelector("#email-view").style.display = "none";
  document.querySelector("#compose-view").style.display = "block";

  // Clear out composition fields
  document.querySelector("#compose-recipients").value = "";
  document.querySelector("#compose-subject").value = "";
  document.querySelector("#compose-body").value = "";
}
// send email section
function send_email(event) {
  event.preventDefault();
  const recipients = document.querySelector("#compose-recipients").value;
  const subject = document.querySelector("#compose-subject").value;
  const body = document.querySelector("#compose-body").value;
  fetch("/emails", {
    method: "POST",
    body: JSON.stringify({
      recipients: recipients,
      subject: subject,
      body: body,
    }),
  })
    .then((response) => response.json())
    .then((result) => {
      load_mailbox("sent", result);
    })
    .catch((error) => console.log(error));
}
// load mailbox 
function load_mailbox(mailbox, message = "") {
  document.querySelector("#message-div").textContent = "";
  if (message !== "") {
    alertmsg(message);
  }
  // Show the mailbox and hide other views
  document.querySelector("#emails-view").style.display = "block";
  document.querySelector("#compose-view").style.display = "none";
  document.querySelector("#email-view").style.display = "none";
  // Show the mailbox name
  document.querySelector("#emails-view").innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1) }</h3>`;
  fetch(`/emails/${mailbox}`)
    .then((response) => response.json())
    .then((emails) => {
      emails.forEach((item) => {
        const e = document.createElement("div");
        e.classList.add("arrow");
        email_inbox_section(item, e, mailbox);
        e.addEventListener("click", () => viewemail(item["id"]));
        document.querySelector("#emails-view").append(e);
      });
    })
    .catch((error) => console.error(error));
}
// bootstrap alert messages
function alertmsg(message) {
  const msg = document.createElement("div");
  msg.classList.add("alert");
  if (message["message"]) {
    msg.classList.add("alert-success");
    msg.innerHTML = message["message"];
  } else if (message["error"]) {
    msg.classList.add("alert-danger");
    msg.innerHTML = message["error"];
  }
  document.querySelector("#message-div").append(msg);
}

// inbox section
function email_inbox_section(item, e, mailbox) {
  if (mailbox === "inbox" && item["archived"]) {
    return;
  }
  else if (mailbox === "archive" && !item["archived"]) {
    return;
  }
  const m = document.createElement("div");
  const recipients = document.createElement("strong");
  if (mailbox === "sent") {
    recipients.innerHTML = item["recipients"].join(", ") + " ";
  }
  else {
    recipients.innerHTML = item["sender"] + " ";
  }
  m.append(recipients);
  m.innerHTML +=  ` <span> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>${item["subject"]}`;
  const date = document.createElement("div");
  date.innerHTML = item["timestamp"];
  date.style.display = "inline-block";
  date.style.float = "right";
  if (item["read"]) {
    e.style.backgroundColor = "gray";
    date.style.color = "black";
  } else {
    e.style.backgroundColor = "white";
    date.style.color = "black";
  }
  m.append(date);
  m.style.padding = "10px";
  e.append(m);
  e.style.margin = "3px";
}

// email to read
function viewemail(id) {
  document.querySelector("#emails-view").style.display = "none";
  document.querySelector("#email-view").style.display = "block";
  document.querySelector("#email-view").innerHTML = "";
  fetch(`/emails/${id}`)
    .then(response => response.json())
    .then(result => {
      single_email(result);
    })
    .catch(error => console.log(error));
  fetch(`/emails/${id}`, {
    method: "PUT",
    body: JSON.stringify({
      read: true
    })
  });
}

// single email view section
function single_email(email) {
  const from = document.createElement("div");
  const to = document.createElement("div");
  const subject = document.createElement("div");
  const timestamp = document.createElement("div");
  const reply = document.createElement("button");
  const arch = document.createElement("button");
  const body = document.createElement("div");
  from.innerHTML = `<strong >From: &nbsp; &nbsp; &nbsp; &nbsp;  </strong>${email["sender"]}`;
  to.innerHTML = `<strong>To:  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</strong> ${email["recipients"].join(", ")}`;
  subject.innerHTML = `<h1 style="font-size:70px;"> ${email["subject"]} </h1>`;
  timestamp.innerHTML = `<span class="text">${email["timestamp"]} </span> `;
  timestamp.style.float = "right";
  body.innerHTML = `<span style="font-size:25px;">${email["body"]} </span> `;

  //Archive button
  if (email["archived"]) {
    arch.innerHTML = "<i class=\"fas fa-inbox\" style=\"margin-right: 5px\"></i>Unarchive";
  }
  else {
    arch.innerHTML = "<i class=\"fas fa-archive\" style=\"margin-right: 5px\"></i>Archive";
  }
  arch.className = "btn btn-warning arc";
  arch.addEventListener("click", () => {
    fetch(`/emails/${email["id"]}`, {
      method: "PUT",
      body: JSON.stringify({
      archived: !email["archived"]
      })
    });
    load_mailbox("inbox");
  });
  //Reply button
  reply.innerHTML = "<i class=\"fas fa-arrow-circle-left\" style='margin-right: 5px'></i>Reply";
  reply.className = "btn btn-danger m-2 size";
  reply.addEventListener("click", () => {
    // Show compose view and hide other views
    compose_email();
    // Clear out composition fields
    document.querySelector("#compose-recipients").value = email["sender"];
    document.querySelector("#compose-subject").value = `Re: ${email['subject']}`;
    document.querySelector("#compose-body").value = `On ${email["timestamp"]} ${email["sender"]} wrote:${email["body"]}`;
  });
  document.querySelector("#email-view").append(timestamp);
    document.querySelector("#email-view").append(from);
    document.querySelector("#email-view").append(to);
document.querySelector("#email-view").append(document.createElement("br"));
  document.querySelector("#email-view").append(subject);
  document.querySelector("#email-view").append(document.createElement("br"));
  document.querySelector("#email-view").append(document.createElement("br"));
  document.querySelector("#email-view").append(body);
document.querySelector("#email-view").append(document.createElement("br"));
document.querySelector("#email-view").append(document.createElement("br"));
document.querySelector("#email-view").append(document.createElement("br"));
document.querySelector("#email-view").append(document.createElement("br"));
  document.querySelector("#email-view").append(arch);
  document.querySelector("#email-view").append(reply);

}
