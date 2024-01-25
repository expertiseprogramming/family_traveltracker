import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "world",
  password: "alishia5*now",
  port: 5432,
});
db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

let currentUserId = 1;

let users = [];

//To get visited countries of current user
async function checkVisisted(current_user_id) {
  const result = await db.query("SELECT country_code FROM visited_countries where user_id = " + current_user_id);
  let countries = [];
  result.rows.forEach((country) => {
    countries.push(country.country_code);
  });
  return countries;
}

//To get current user details
async function getCurrentUser(currentUserId){
  const result = await db.query("select * from users");
  let details = result.rows;
  return details.find((user) => user.id == currentUserId);
}

//Adding a new member
async function addNewUSer(user_details){
  let details = await db.query("insert into users(color, user_name) values ('" + user_details.color + "'," + "'" + user_details.name + "' ) RETURNING id")
  const user_id = details.rows[0].id;
  return user_id;
}

//To display home page
app.get("/", async (req, res) => {
  let data = await db.query("SELECT * from users");
  users = data.rows;
  const current_user = await getCurrentUser(currentUserId);
  let countries = []
  try {
    countries = await checkVisisted(current_user.id);
  } catch (error) {
    countries = [];
  }
  res.render("index.ejs", {
    countries: countries,
    total: countries.length,
    users: users,
    color: current_user.color,
  });
});

//To add new user
app.post("/add", async (req, res) => {
  const input = req.body["country"];
  try {
    const result = await db.query(
      "SELECT country_code FROM countries WHERE LOWER(country_name) LIKE '%' || $1 || '%';",
      [input.toLowerCase()]
    );
    const data = result.rows[0];
    const countryCode = data.country_code;
    try {
      const data = await db.query(
        "INSERT INTO visited_countries (country_code, user_id) VALUES ('" + countryCode + "'," + currentUserId + ")"
      );
      console.log(data)
      res.redirect("/");
    } catch (err) {
      res.redirect("/");
      console.log(err);
    }
  } catch (err) {
    res.redirect("/");
    console.log(err);
  }
});

// Display selected user details or add new user form
app.post("/user", async (req, res) => {
  if (req.body.add === "new") {
    res.render("new.ejs");
  } else {
    currentUserId = req.body.user;
    res.redirect("/");
  }
});

//To add a new member
app.post("/new", async (req, res) => {
  let new_user = req.body
  currentUserId = await addNewUSer(new_user)
  res.redirect("/");
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
