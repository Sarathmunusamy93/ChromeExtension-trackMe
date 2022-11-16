$(document).ready(function () {
  $(".ui.dropdown").dropdown();

  $("#updateSiteControl").hide();

  renderControlSitesList();

  $("#controlsDetailsTableBody").on("click", "#controlStatus", function () {
    if ($(this).hasClass("active")) {
      $(this).removeClass("active");
      $(this).text("Disabled");
    } else {
      $(this).addClass("active");
      $(this).text("Active");
    }
  });

  $("#getAllLS").click(function (event) {
    chrome.runtime.sendMessage({
      type: "getAllLS",
      options: {
        allURL: "yes",
      },
    });
  });
});

$("#clearLS").click(function () {
  chrome.runtime.sendMessage({
    type: "clearLS",
    options: {
      allURL: "yes",
    },
  });
});

$("#updateSiteControl").click(function (event) {
  newControlsEnteries();

  $("#updateSiteControl").hide();
  $("#addSiteControl").show();
});

function newControlsEnteries() {
  var controlEntry = {
    targetURL: $("#controlSiteURL").val(),
    basis: $(".dropdown").dropdown("get text")[0],
    hours: $("#controlHours").val(),
    status: true,
  };

  add(
    "controlSiteBase",
    "ControlSiteDB",
    controlEntry,
    false,
    function (id, controlSiteDetails) {
      renderControlSitesList();
      saveControlSiteInlocalStorage(controlSiteDetails);
    }
  );

  clearFields();
}

function clearFields() {
  $("#controlSiteURL").val("");
  $("#controlHours").val("");
  $(".text").html("");
}

$("#addSiteControl").click(function (event) {
  newControlsEnteries();
});

function saveControlSiteInlocalStorage(cntrlSiteDetails) {
  var validityDate = 0;

  if (cntrlSiteDetails.basis) {
    switch (cntrlSiteDetails.basis) {
      case "Weekly":
        validityDate = 7;
        break;
      case "Monthly":
        validityDate = 30;
        break;
      case "Daily":
        validityDate = 1;
        break;
      default:
        validityDate = 0;
        break;
    }
  }

  var controlSiteInstance = {
    status: cntrlSiteDetails.status,
    basis: validityDate,
    restrictedHour: parseInt(cntrlSiteDetails.hours),
    activeTime: 0,
    targetUrl: cntrlSiteDetails.targetURL,
    startedTime: new Date(),
  };

  chrome.storage.sync.get("restrictedSitesDeatils", function (result) {
    var allResirectedSites = [];
    if (
      Object.keys(result).length &&
      result &&
      result != "" &&
      result.restrictedSitesDeatils
    ) {
      allResirectedSites = JSON.parse(result.restrictedSitesDeatils);

      allResirectedSites.push(controlSiteInstance);
    } else {
      allResirectedSites.push(controlSiteInstance);
    }

    chrome.storage.sync.set({
      restrictedSitesDeatils: JSON.stringify(allResirectedSites),
    });

    chrome.runtime.sendMessage({
      type: "createAlarmForControlRenewal",
      options: {
        controlSiteInstance,
      },
    });
  });

  //   chrome.storage.sync.set(
  //     {
  //       [cntrlSiteDetails.targetURL + "_" + cntrlSiteDetails.basis]:
  //         JSON.stringify(controlSiteInstance),
  //     },
  //     function () {}
  //   );

  //   chrome.storage.sync.get

  console.log(cntrlSiteDetails);
}
function renderControlSitesList() {
  fun = function (results) {
    if (results.length < 1) {
      let emptyRow =
        '  <tr id="row"> <td data-label="DateTime" colSpan="5" style="text-align: center"> Add Any Controls To Show Here!!!! </td></tr> ';
      $(" #controlsDetailsTableBody ").append(emptyRow);
    } else {
      results.forEach((result, index) => {
        var statusButton = result.status
          ? '<button class="ui toggle button active" id="controlStatus">Active</button> '
          : '<button class="ui toggle button" id="controlStatus">Disabled</button> ';

        var tblRow =
          '  <tr id="row' +
          index +
          '"> <td data-label="DateTime" class="status"> ' +
          statusButton +
          '  </td>  <td data-label="DateTime" class="targetURL">  ' +
          result.targetURL +
          '  </td>  <td data-label="Message" class="basis"> ' +
          result.basis +
          " </td> " +
          '<td data-label="TargetURL" class="hours"> ' +
          result.hours +
          " </td>" +
          '<td data-label="TargetURL"> <i class="large delete outline icon" id=' +
          result.id +
          '></i> <i class="large edit outline icon" id=' +
          result.id +
          "></i></td>" +
          "</tr>";

        $(" #controlsDetailsTableBody ").append(tblRow);
      });
    }
  };

  $(" #controlsDetailsTableBody ").html("");
  getAll("controlSiteBase", "ControlSiteDB", fun);
}

$(document.body).on("click", ".delete", function (event) {
  deleteControls(parseInt(event.target.id));
  $("#controlsDetailsTableBody").html("");
  renderControlSitesList();
});

$(document.body).on("click", ".edit", function (event) {
  editControls(event);
});

function editControls(event) {
  let id = parseInt(event.target.id),
    parentRowID = $($(event.target).closest("tr")).attr("id"),
    targetURL = $("#" + parentRowID + " .targetURL").html(),
    basis = $("#" + parentRowID + " .basis").html(),
    hours = $("#" + parentRowID + " .hours").html();
  hours = "" + parseInt(hours);

  $(".text").html(basis);
  $("#value_0").addClass("selected");

  $("#controlSiteURL").val(targetURL);
  $("#controlHours").val(hours);

  $("#updateSiteControl").show();
  $("#addSiteControl").hide();

  deleteControls(id);
}

function deleteControls(id) {
  del("controlSiteBase", "ControlSiteDB", id, true);
}
