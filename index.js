//Import server essentials.
const express = require('express');
const app = express();
const cors = require('cors');
const helmet = require('helmet');
const http = require('http');
const server = http.createServer(app);
const io = require('socket.io')(server);
const PORT = 80;

//Other dependencies.
const { validate } = require('email-validator');
const path = require('path');
const fs = require('fs');
const Email = require('email-templates');
const moment = require('moment');
const pfp = require('./pfp.json')

//Initialize postgres code.
const { Pool } = require('pg');
const hash = require('object-hash');
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'arch',
    password: 'postgres',
    port: 5432
});
pool.connect();

//Express routing code.
app.use(cors());
app.use(helmet());
app.use("/static", express.static(path.join(__dirname, "static")));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use("/logup", function (req, res) {
    res.render("pages/logup");
});
app.use("/home", async function(req, res) {
    res.render("pages/home")
})
app.use("/search", async function (req, res) {
    var query = req.query.q;
    var tags = req.query.t;
    res.locals.list = await algorithm(query, tags);
    res.render("pages/search");
});
app.use("/edit", function (req,res){
    res.render("pages/edit");
});
app.use("/view", function (req,res){
    res.locals.uuid = req.query.uuid;
    res.render("pages/view");
});
app.use("/", function (req, res) {
    res.render("pages/welcome");
});

//Socket.io code.
io.on('connection',function (socket){
    var id = socket.id;
    socket.on('checktoken', async function (token, callback) {
        var query = await pool.query(`SELECT EXISTS(SELECT 1 FROM "public"."users" WHERE id = ${token});`);
        query = query["rows"][0]["exists"];
        callback(query);
    });
    socket.on("getpdata", async function (token, callback) {
        var user = await pool.query(`SELECT resume, skills, education, bday, pfp, bio, name FROM "public"."users" WHERE id = ${token};`);
        callback(user["rows"][0]);
    });
    socket.on("getpfdata", async function (token, userid, callback) {
        var user = await pool.query(`SELECT resume, skills, education, bday, pfp, bio, name, email, visits FROM "public"."users" WHERE id = ${token};`);
        user.rows[0].bday = moment(user.rows[0].bday).fromNow().replace("ago","old");
        user.rows[0].visits[userid] = "a";
        pool.query(`UPDATE "public"."users" SET visits='${JSON.stringify(user.rows[0].visits)}' WHERE id=${token}`);
        callback(user["rows"][0]);
    });
    socket.on("checkedemail", async function(token,userid){
        var emailobj = await pool.query(`SELECT emailclicks FROM "public"."users" WHERE id=${token}`);
        emailobj = emailobj.rows[0].emailclicks;
        emailobj[userid] = "a";
        pool.query(`UPDATE "public"."users" SET emailclicks='${JSON.stringify(emailobj)}' WHERE id=${token}`);
    })
    socket.on("pfchange", async function (token, obj, callback) {
        var education = "ARRAY[";
        for(i=0; i< obj["education"].length; i++){
            education = education + "'" + JSON.stringify(obj["education"][i]) + "'::json";
            if(i != obj["education"].length - 1){
                education = education + ",";
            };
        };
        var education = education + "]";
        if (obj.birthdate == "") {;
            obj.birthdate = "1984-1-24"
        };
        if(JSON.stringify(obj.skills) == "[]"){
            obj.skills = ["None"];
        };
        console.log(obj.resume)
        var resume = "ARRAY[";
        for(i=0; i< obj["resume"].length; i++){
            resume = resume + "'" + replaceAll(JSON.stringify(obj["resume"][i]),"'","''") + "'::json";
            if(i != obj["resume"].length - 1){
                resume = resume + ",";
            };
        };
        resume = resume+"]";
        await pool.query(`UPDATE "public"."users" SET name = '${obj.name}', education = ${education}, bio = '${replaceAll(obj.bio,"'","''")}', skills = ARRAY${replaceAll(replaceAll(JSON.stringify(obj.skills), "'", ""),"\"","'")}, bday = '${replaceAll(obj.birthdate, "'", "''")+" 10:10:10.101010"}', resume = ${resume} WHERE id = ${token};`);
        callback("Saved Changes");
    });
    socket.on('signup', async function(name, email, password, callback){
        if(validate(email)){
            var emailquery = await pool.query(`SELECT EXISTS(SELECT 1 FROM "public"."users" WHERE email = '${replaceAll(email, "'", "''").toLowerCase()}');`);
            emailquery = emailquery["rows"][0]["exists"];
            if(emailquery) {
                callback([false, "Email already used in another account"]);
            } else {
                var uuid;
                var idexists = true;
                while (idexists) {
                    uuid = numlengen(14);
                    idexists = await pool.query(`SELECT EXISTS(SELECT 1 FROM "public"."users" WHERE 'id' = '${uuid}');`);
                    idexists = idexists["rows"][0]["exists"];
                };
                await pool.query(`INSERT INTO "public"."users" (id, name, resume, pastjobs, bio, pfp, datejoined, email,password,contactinfo,bday, education,skills,visits,emailclicks) VALUES (${uuid},'${name}','{}','{}','"Don''t trust quotes made by a random person" - Niels Bohr','${pfp["pfp"]}',NOW(),'${replaceAll(replaceAll(email, "'", "''"), "\"", "\\\"").toLowerCase()}','${hash(password)}','{}',null,'{}','{}','{}','{}');`);
                callback([true, uuid]);
            };
        } else {
            callback([false, "Invalid email."]);
        };
    });
    socket.on('login', async function (email,password,callback){
        if(validate(email)){
            var boolcond = await pool.query(`SELECT EXISTS(SELECT 1 FROM "public"."users" WHERE email = '${replaceAll(email,"'","''").toLowerCase()}');`);
            if(boolcond.rows[0].exists){
                var query = await pool.query(`SELECT password,id FROM "public"."users" WHERE email = '${replaceAll(email, "'", "''").toLowerCase()}';`);
                if(query.rows[0].password == hash(password)){
                    callback([true, query.rows[0].id]);
                }else{
                    callback([false, "Incorrect Password"]);
                };
            }else{
                callback([false,"Account With This Email Does Not Exist"]);
            };
        }else {
            callback([false, "Invalid Email."]);
        };
    });
});

//Expose the server to internet.
server.listen(PORT, console.log(`Listening on port: ${PORT}`));

//Additional functions.
function numlengen(len) {
    var num = "";
    for (var i = 0; i < len; i++) {
        num  = num + `${Math.round(Math.random() * 9)}`;
    };
    return parseInt(num);
};

function replaceAll(str, find, replace) {
    var escapedFind=find.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
    return str.replace(new RegExp(escapedFind, 'g'), replace);
};

function sqlbool(conditional){
    if(conditional){
        return "t";
    }else{
        return "f";
    };
};

async function algorithm (query, tags, type) {
    if(query) {
        var result = await pool.query(`SELECT * FROM "public"."users" WHERE LOWER(name) LIKE LOWER('${query}%');`);
        for(i=0;i<result["rows"].length;i++) {
            result["rows"][i]["bday"] = moment(result["rows"][i]["bday"]).fromNow().replace("ago","old");
        }
        return result["rows"]
    } else {
        tags = "'"+tags+"']";
        tags = tags
        tags = replaceAll(replaceAll(tags,",","','"),"',' ","','");
        var candidates = await pool.query(`SELECT * FROM "public"."users" WHERE skills && ARRAY[${tags};`);
        candidates = candidates.rows;
        var wantedskills = eval("["+tags.replace("ARRAY", ""));
        var idlist = [];
        var agelist = [];
        var matchlist = [];
        var distancelist = [];
        var emaillist = [];
        for (var i = 0; i < candidates.length; i++) {
            var overlappingskills = incommon(wantedskills, candidates[i].skills);
            var age = parseInt(moment(candidates[i]["bday"]).fromNow().replace(" years ago", ""));
            var agescore = steps.age(age, overlappingskills.length);
            var matchscore = steps.matching(candidates[i], wantedskills, overlappingskills);
            var distancescore = steps.distance(overlappingskills, wantedskills)
            var emailscore = steps.clickratio(Object.keys(candidates[i].visits).length, Object.keys(candidates[i].emailclicks).length)
            idlist.push(candidates[i]["id"])
            agelist.push(agescore);
            matchlist.push(matchscore);
            distancelist.push(distancescore);
            emaillist.push(emailscore);
        }

        var normalizedagescore = steps.normalize(agelist);
        var normalizedmatchscore = steps.normalize(matchlist);
        var normalizeddistancescore = steps.normalize(distancelist);
        var normalizedemailscore = steps.normalize(emaillist);
        var total = [];
        for (var i = 0; i < idlist.length; i++) {
            var newobj = candidates.find(o => o.id == idlist[i]);
            newobj["sum"] = normalizedagescore[i] + normalizedmatchscore[i] - normalizeddistancescore[i] + normalizedemailscore[i];
            newobj["bday"] = moment(newobj["bday"]).fromNow().replace("ago", "old");
            total.push(newobj);
        }
        total.sort((a, b) => (a.sum > b.sum) ? 1 : (a.sum === b.sum) ? ((a.sum > b.sum) ? 1 : -1) : -1 ).reverse();
        return total;
    };
};

var steps = {
    matching: function (person, tags, overlappingskills){
        var amountofmatches = overlappingskills.length;
        for (var i = 0; i < person["resume"].length; i++) {
            amountofmatches += incommon(person["resume"][i]["tags"], tags).length
        }
        return amountofmatches;
    },
    distance: function (overlappingskills, wantedskills){
        return Math.sqrt(wantedskills.length-overlappingskills.length);
    },
    age: function (age,i) {
        return (16*i)/age;
    },
    clickratio: function (views,emailclicks){
        if(views == 0){
            return 0
        }
        return emailclicks/views;
    },
    normalize: function (array) {
        var highest = Math.max(...array);
        if (highest != 0){
            for (var i = 0; i < array.length; i++) {
                array[i] = array[i]/highest
            }
        } else {
            for (var i = 0; i < array.length; i++) {
                array[i] = 0
            }
        }
        return array;
    }
}
function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}
function incommon (array1, array2) {
    return array1.filter(value => array2.includes(value));
}