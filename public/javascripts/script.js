/* eslint max-lines-per-function: "off" */

$(function() {
  let contactTemplate = Handlebars.compile($('#contact').html());
  let createContactTemplate = Handlebars.compile($('#create-contact').html());
  let rowTemplate = Handlebars.compile($('#row').html());
  let editContactTemplate = Handlebars.compile($('#edit-contact').html());

  let allTags = [];
  let $contactsContainer;

  //Adding initial contacts
  displayRow();
  displayContacts();

  function displayRow() {
    //Adding the Top Row to the DOM
    $('.main-container').append(rowTemplate());

    updateTags();

    //Adding an event listener to the tag button ul to search by tag
    $('.tag-buttons').click(searchContactsByTag);

    //Adding Event Listener to 'Search by Name Input'
    $('.contact-name-search').keyup(function(event) {
      let search = event.target.value.toLowerCase();

      $('li.media').each(function() {
        let name = this.querySelector('h3').textContent.toLowerCase();
        if (!name.includes(search)) {
          this.style.display = 'none';
        } else {
          this.style.display = null;
        }
      });
    });

    //Adding event handler to 'add contact' button to display form
    $('#add-contact').click(function(event) {
      event.preventDefault();

      //Replace the top row and contacts with the Create Contact Form
      let createContactForm = createContactTemplate({tags: allTags});
      $('#row-and-contacts').replaceWith(createContactForm);

      //adding event listener to 'add a tag' form
      $('#sub-form').submit(addTagToList);

      //adding event listener to create contact form to handle submission
      $('.contact-form').submit(function(event) {
        event.preventDefault();

        //Getting the values of each input element of the form
        let [ fullName, email, phoneNumber, tags ] = getFormInputs();

        if (validateInput(fullName, email, phoneNumber)) {
          addContact(fullName, email, phoneNumber, tags);

          $('#create-contact-form').remove();
          displayRow();
          displayContacts();
        }
      });

      //adding event listener to cancel button to remove contact form from DOM
      $('.btn-close-form').click(removeContactForm);
    });

    //adding event listener to show all contacts button
    $('#show-all').click(showAllContacts);

    $contactsContainer = $('.contacts-container'); //Will not work if the top row is not added to the DOM
    //Adding event listener to contacts-container to
    //handle delete and edit events
    $contactsContainer.click(function(event) {
      event.preventDefault();

      let btnDiv = event.target.parentNode;
      let id = btnDiv.parentNode.dataset.id;

      if (event.target.className.includes('delete-contact')) {
        confirmAndDelete(id);
      } else if (event.target.className.includes('edit-contact')) {
        let dl = btnDiv.previousElementSibling.firstElementChild;
        let [ fullName, phoneNumber, email, tagLis, selectedTags ] = [
          btnDiv.parentNode.firstElementChild.textContent.trim(),
          dl.children[1].textContent,
          dl.children[3].textContent,
          dl.children[5].firstElementChild.children,
          []
        ];
        for (let idx = 0; idx < tagLis.length; idx++) {
          selectedTags.push(tagLis[idx].textContent);
        }
        $('#row-and-contacts').replaceWith(editContactTemplate({
          fullName,
          phoneNumber,
          email,
          selectedTags,
          unselectedTags: allTags.filter(tag => !selectedTags.includes(tag))
        }));

        //adding event listener to 'add a tag' form
        $('#sub-form-edit').submit(addTagToList);

        //adding event listener to edit contact form to handle submission
        $('#edit-contact-form').submit(function(event) {
          event.preventDefault();

          //Getting the values of each input element of the form
          let [ fullName, email, phoneNumber, tags ] = getFormInputs();

          if (validateInput(fullName, email, phoneNumber)) {
            editContact(id, fullName, email, phoneNumber, tags);

            $('#edit-contact-form').remove();
            displayRow();
            displayContacts();
          }
        });

        //adding event listener to cancel button to remove edit form from DOM
        $('.btn-close-form').click(function(event) {
          event.preventDefault();

          $('#edit-contact-form').remove();
          displayRow();
          displayContacts();
        });
      }
    });
  }

  function getFormInputs() {
    return [
      $('.contact-name-input').val(),
      $('.contact-email-input').val(),
      $('.contact-phone-input').val(),
      $('.contact-tags-input').val().join(',')
    ];
  }

  function updateTags() {
    $.ajax({
      type: 'GET',
      url: 'http://localhost:3000/api/contacts',
      dataType: 'json'
    }).done(function(json) {
      $('.tag-buttons').empty();
      allTags = [];
      json.forEach(contact => {
        contact.tags = contact.tags.split(',');
        contact.tags.forEach(tag => {
          if (!allTags.includes(tag)) {
            allTags.push(tag);
            addTagToDOM(tag);
          }
        });
      });
    });
  }

  function confirmAndDelete(id) {
    if (window.confirm("Are you sure you want to delete this contact?")) {
      updateTags();
      deleteContact(id);
      displayContacts();
    }
  }

  function removeContactForm(event) {
    event.preventDefault();

    $('#create-contact-form').remove();
    displayRow();
    displayContacts();
  }

  function showAllContacts(event) {
    event.preventDefault();

    $('.contact-name-search')[0].value = '';

    $('li.media').each(function() {
      this.style.display = null;
    });
  }

  function addTagToList(event) {
    event.stopPropagation();
    event.preventDefault();

    let newTag = $('.add-tag-input')[0].value;
    let option = document.createElement('option');
    option.innerText = newTag;
    $('.contact-tags-input').append(option);
    $('.add-tag-input')[0].value = null;
  }

  function addTagToDOM(tag) {
    let li = document.createElement('li');
    li.classList.add('tag-button');
    let a = document.createElement('a');
    a.classList.add('btn', 'btn-outline');
    a.href = "#";
    a.textContent = tag;
    li.append(a);
    $('.tag-buttons')[0].append(li);
  }

  function validateInput(name, email, phone) {
    if (!isValidName(name)) {
      showError('name');
    } else {
      removeError('name');
    }

    if (!isValidEmail(email)) {
      showError('email');
    } else {
      removeError('email');
    }

    if (!isValidPhone(phone)) {
      showError('phone');
    } else {
      removeError('phone');
    }

    return isValidName(name) && isValidEmail(email) && isValidPhone(phone);
  }

  function isValidName(name) {
    return /\S+/.test(name);
  }

  function isValidEmail(email) {
    return /^[a-zA-Z0-9+_.-]+@[a-zA-Z0-9.-]+$/.test(email);
  }

  function isValidPhone(phone) {
    return /\d+/.test(phone);
  }

  function showError(type) {
    let input = 'name';
    if (type === 'phone') {
      input = 'phone number';
    } else if (type === 'email') {
      input = 'email address';
    }
    $(`.form-group-${type}`)[0].classList.add('has-error');
    $(`.contact-${type}-input`).next()[0].innerText = `Please enter a valid ${input}`;
  }

  function removeError(type) {
    $(`.form-group-${type}`)[0].classList.remove('has-error');
    $(`.contact-${type}-input`).next()[0].innerText = "";
  }

  function addContact(fullName, email, phoneNumber, tags) {
    fullName = encodeURIComponent(fullName);
    email = encodeURIComponent(email);
    phoneNumber = encodeURIComponent(phoneNumber);
    tags = tags === '' ? 'none' : encodeURIComponent(tags);
    let data = `full_name=${fullName}&email=${email}&phone_number=${phoneNumber}&tags=${tags}`;
    $.ajax({
      type: 'POST',
      url: 'http://localhost:3000/api/contacts/',
      dataType: 'json',
      data: data
    }).done(json => {
      console.log(json);
    });
  }

  function editContact(id, fullName, email, phoneNumber, tags) {
    fullName = encodeURIComponent(fullName);
    email = encodeURIComponent(email);
    phoneNumber = encodeURIComponent(phoneNumber);
    tags = tags === '' ? 'none' : encodeURIComponent(tags.replace(/\s+/g, ','));
    let data = `full_name=${fullName}&email=${email}&phone_number=${phoneNumber}&id=${id}&tags=${tags}`;
    $.ajax({
      type: 'PUT',
      url: `http://localhost:3000/api/contacts/${id}`,
      dataType: 'json',
      data: data
    });
  }

  function deleteContact(id) {
    $.ajax({
      type: 'DELETE',
      url: `http://localhost:3000/api/contacts/${id}`,
    });
  }

  function displayContacts() {
    //remove pre-existing contacts from the DOM
    $contactsContainer.empty();

    //get contacts and add to DOM
    $.ajax({
      type: 'GET',
      url: 'http://localhost:3000/api/contacts',
      dataType: 'json'
    }).done(function(json) {
      json.forEach(contact => {
        contact.tags = contact.tags.split(',');
        $contactsContainer.append(contactTemplate(contact));

        let contactTagButtons = $contactsContainer
          .children()
          .last()[0]
          .querySelector('ul');
        //Adding an event listener to the tag button ul to search by tag
        contactTagButtons.addEventListener('click', searchContactsByTag);
      });
    });
  }

  function searchContactsByTag(event) {
    event.preventDefault();

    if (event.target.tagName === 'A') {
      let tag = event.target.textContent;

      $('li.media').each(function() {
        let ul = this
          .children[1]
          .firstElementChild
          .children[5]
          .firstElementChild;
        let liArray = Array.from(ul.children);

        if (!liArray.some(li => li.firstElementChild.textContent === tag)) {
          this.style.display = 'none';
        } else {
          this.style.display = null;
        }
      });
    }
  }

});
