var colleges = [];

var user, uid, uri, col, results, topMajors;
var i = 0;

var config = {
    apiKey: "AIzaSyC0WbYQ2LQ0tGdD8jwCoixt694HtfcI9GY",
    authDomain: "collegeapi-8a688.firebaseapp.com",
    databaseURL: "https://collegeapi-8a688.firebaseio.com",
    projectId: "collegeapi-8a688",
    storageBucket: "",
    messagingSenderId: "39234916657"
};

firebase.initializeApp(config);

var database = firebase.database();
var provider = new firebase.auth.GoogleAuthProvider();

//Search college button
$('#search-college-button').click(function () {
    $("#searching-for-colleges").html("<p>Searching for colleges that include '" + $('#name-selector').val() + "'...</p>");
    searchCollege($('#name-selector').val());
});

//Add college button
$('#add-college-button').click(function () {
    var id = $('#college-selector').val();
    var name = $('#college-selector option[value=' + id + ']').text();
    console.log(name);
    var status = $('#status-selector').val();
    addCollege(id, name, status);
});

function signIn() {
    firebase.auth().signInWithRedirect(provider);
    $(".authenticate").attr("onclick", "signOut()");
}

function signOut() {
    $("#not-signed-in").fadeIn(100);
    firebase.auth().signOut().then(function () {
        $("h1").text("College Organizer");
        $("#add-college").fadeOut(200);
        $("#college-list").fadeOut(200);
        setTimeout(function () {
            $("#college-list").empty();
        }, 200);
        $(".authenticate").attr("onclick", "signIn()");
        $(".authenticate").html("<i class='fa fa-google' aria-hidden='true'></i> SIGN IN");
    })
}

firebase.auth().getRedirectResult().then(function (result) {
    if (result.credential) {
        var token = result.credential.accessToken;
    }
    var user = result.user;
    user = firebase.auth().currentUser;
}).catch(function (error) {
    console.log("Error: " + error.message + " " + error.code);
});

firebase.auth().onAuthStateChanged(user => {
    if (user != null) {
        $("#not-signed-in").fadeOut(100);
        $(".authenticate").attr("onclick", "signOut()");
        $(".authenticate").html("<i class='fa fa-google' aria-hidden='true'></i> SIGN OUT");
        uid = user.uid;
        $("h1").text(user.displayName.split(' ')[0] + "'s College Organizer");
        $("#add-college").fadeIn(100);
        database.ref('users/' + user.uid).update({
            name: user.displayName,
            email: user.email,
            picture: user.photoURL
        });
        getColleges();
    } else {
        setTimeout(function () {
            $(".authenticate").css("border-color", "#60d4ff");
        }, 500);
        setTimeout(function () {
            $(".authenticate").css("border-color", "#555");
        }, 2500);
    }
});

function addCollege(id, name, status) {
    if (id != "") {
        database.ref('users/' + uid + '/colleges/' + name).update({
            'id': id,
            'name': name,
            'status': status
        });
        $("#name-selector").css("border-color", "#179600");
        setTimeout(function () {
            document.getElementById("name-selector").value = "";
            $("#name-selector").css("border-color", "#444");
        }, 2000);
        $("#college-list").empty();
        i = 0;
        getColleges();
    }
}

function removeCollege(college) {
    database.ref('users/' + uid + '/colleges/' + college).remove();
    $("#college-list").empty();
    i = 0;
    getColleges();
}

function searchCollege(college) {
    $("#searching-for-colleges").fadeIn(100);
    $("#no-college-error").fadeOut(100);
    $("#college-selector-form").fadeOut(100);
    $("#college-selector").empty();
    uri = "https://api.data.gov/ed/collegescorecard/v1/schools?school.name=" + college + "&api_key=bzZKWtSlWh0UHMHpTBD85NoqEJvBQW5TKlwA8WHE";
    $.getJSON(encodeURI(uri), function (data) {}).done(function (data) {
        $("#searching-for-colleges").css("display", "none");
        if (data.results.length == 0) {
            $("#no-college-error").fadeIn(100);
        } else if (data.results.length > 0) {
            for (i = 0; i < data.results.length; i++) {
                $("#college-selector").append("<option id='search-result-" + data.results[i].id + "' value=" + data.results[i].id + ">" + data.results[i].school.name + "</option>");
                //$("#college-selector").append("<option value=" + data.results[i].school.name.replace(/ /g, "_") + ">" + data.results[i].school.name + "</option>");
            }
            $("#college-selector-form").fadeIn(100);
        }
        $("#search-results").fadeIn(100);
    });
}

function getColleges() {
    colleges = [];
    database.ref('users/' + uid + '/colleges').ref.once("value").then(function (snapshot) {
        snapshot.forEach(function (node) {
            colleges.push({
                id: node.val()["id"],
                name: node.val()["name"],
                rank: node.val()["status"]
            });
        });
        colleges = _.sortBy(colleges, 'rank').reverse();
        check();
    });
}

function check() {
    $("#loading").text("Loading...");
    if (colleges.length == 0) {
        $("#loading").text("You haven't added any colleges yet!");
    }
    if (i < colleges.length) {
        uri = "https://api.data.gov/ed/collegescorecard/v1/schools?id=" + colleges[i].id + "&api_key=bzZKWtSlWh0UHMHpTBD85NoqEJvBQW5TKlwA8WHE";
        col = rank(colleges[i].rank);
        $.getJSON(encodeURI(uri), function (data) {
            console.log(data.results);
        }).done(function (data) {
            $("#loading").remove();
            school = data.results[0];
            topMajors = Object.keys(school[2014].academics.program_percentage).sort(function (a, b) {
                return school[2014].academics.program_percentage[a] - school[2014].academics.program_percentage[b]
            }).reverse().slice(0, 3);
            if (data.results.length == 0) {
                $("#college-list").append('<div class="panel"><a data-toggle="collapse" data-parent="#college-list" href="#college-' + i + '"><div class="panel-heading"><h4 class="panel-title" style="color: #ff6969">Unknown School</h4><h5>Please try typing the full name of the school.</h5></div></a><div id="college-' + i + '" class="panel-collapse collapse"></div></div></div>');
            } else {
                $("#college-list").append('<div class="panel"><a data-toggle="collapse" data-parent="#college-list" href="#college-' + i + '"><div class="panel-heading"><h4 class="panel-title">' + school.school.name + '</h4>' + col + '</div></a><div id="college-' + i + '" class="panel-collapse collapse"><div class="panel-body"><div class="row"><div class="col-md-2"><p class="menu-item">Location</p><p class="stat-item college-location">' + school.school.city + ', ' + school.school.state + '</p></div><div class="col-md-2"><p class="menu-item">Area</p><p class="stat-item college-location">' + area[school.school.locale] + '</p></div><div class="col-md-2"><p class="menu-item">Undergrad Count</p><p class="stat-item">' + school[2014].student.size + '</p></div><div class="col-md-2"><p class="menu-item">Admission Rate</p><p class="stat-item admission-rate">' + (school[2014].admissions.admission_rate.overall * 100).toFixed(2) + '%</p></div><div class="col-md-2"><p class="menu-item">Average SAT/ACT</p><p class="stat-item test-scores">' + school[2014].admissions.sat_scores.average.overall + '/' + school[2014].admissions.act_scores.midpoint.cumulative + '</p></div><div class="col-md-2"><p class="menu-item">Retention Rate</p><p class="stat-item retention-rate">' + (school[2014].student.retention_rate.four_year.full_time * 100).toFixed(2) + '%</p></div><div class="col-md-6"><p class="menu-item">Top Major Fields</p><p class="stat-item college-majors"><span style="color: white">1. </span>' + majors[topMajors[0]] + '</p><p class="stat-item college-majors"><span style="color: white">2. </span>' + majors[topMajors[1]] + '</p><p class="stat-item college-majors"><span style="color: white">3. </span>' + majors[topMajors[2]] + '</p></div>' + checkTuition(school[2014].cost.tuition.in_state, school[2014].cost.tuition.out_of_state) + '<div class="col-md-2"><p class="menu-item">Students with Loans</p><p class="stat-item loan-rate">' + (school[2014].aid.students_with_any_loan * 100).toFixed(2) + '%</p></div>' + checkReligion(school.school.religious_affiliation) + '</div><div class="row menu-item college-buttons"><div class="col-md-4"><a href="http://' + school.school.school_url + '" class="button" target="_newtab"><i class="fa fa-home" aria-hidden="true"></i> College Homepage</a></div><div class="col-md-4"><a href="http://' + school.school.price_calculator_url + '" class="button" target="_newtab"><i class="fa fa-usd" aria-hidden="true"></i> Net Price Calculator</a></div><div class="col-md-4"><a href="#" class="button remove-college" onclick="removeCollege(\'' + school.school.name + '\');return false;"><i class="fa fa-times" aria-hidden="true"></i> Remove College</a></div></div></div></div></div>');
                errorCheck(i);
            }
            $(".panel").fadeIn(1000);
            i++;
            check();
        });
    }
}

function checkTuition(instate, outstate) {
    if (outstate == null) {
        return "";
    } else if (instate == outstate) {
        return '<div class="col-md-2"><p class="menu-item">Tuition Fee</p><p class="stat-item tuition-out-of-state">$' + outstate + '</p></div>';
    } else {
        return '<div class="col-md-2"><p class="menu-item">Tuition Fee</p><p class="stat-item">$' + instate + ' <p style="color: white; font-size: 20px; margin-top: -20px;">In-State</p></p><p class="stat-item">$' + outstate + ' <p style="color: white; font-size: 20px; margin-top: -20px;">Out-Of-State</p></p></div>';
    }
}

function checkReligion(num) {
    if (num != -2) {
        return '<div class="col-md-2"><p class="menu-item">Religious Affiliation</p><p class="stat-item college-location">' + religions[num] + '</p></div>';
    } else {
        return "";
    }
}

function errorCheck(i) {
    if ($("#college-" + i + " .test-scores").text() == "null/null") {
        $("#college-" + i + " .test-scores").html("<span style='color: #ff7f7f'>N/A</span>");
    }
    if ($("#college-" + i + " .admission-rate").text() == "0.00%") {
        $("#college-" + i + " .admission-rate").html("<span style='color: #ff7f7f'>N/A</span>");
    }
    if ($("#college-" + i + " .retention-rate").text() == "0.00%") {
        $("#college-" + i + " .retention-rate").html("<span style='color: #ff7f7f'>N/A</span>");
    }
    if ($("#college-" + i + " .loan-rate").text() == "0.00%") {
        $("#college-" + i + " .loan-rate").html("<span style='color: #ff7f7f'>N/A</span>");
    }
}

function rank(str) {
    if (str == 5) {
        return "<h5 style=\"color: #fdd500\">Extra Reach</h5>";
    } else if (str == 4) {
        return "<h5 style=\"color: #8cdaff\">Reach</h5>";
    } else if (str == 3) {
        return "<h5 style=\"color: #3efb81\">Middle/Reach</h5>";
    } else if (str == 2) {
        return "<h5 style=\"color: #f8ff8e\">Middle</h5>";
    } else if (str == 1) {
        return "<h5 style=\"color: #ff7c7c\">Safety/Middle</h5>";
    } else if (str == 0) {
        return "<h5 style=\"color: #ff4545\">Safety</h5>";
    }
}
