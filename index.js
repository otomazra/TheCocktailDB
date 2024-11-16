import express from "express";
import axios from "axios";
import bodyParser from "body-parser";
import _ from "lodash";

const app = express();
const port = 3000;
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
let key = 1;
const API_URL = `https://www.thecocktaildb.com/api/json/v1/${key}/`;

//Home page with the search area and some random drinks
app.get("/", async (req, res) => {
  try {
    // Each axios request of the random drink shows only one random drink,
    // so for 20 of them on one page we need the 'for' cycle.
    const result = []; // To save all of the random drinks
    for (let i = 0; i < 20; i++) {
      result.push(await axios.get(API_URL + "random.php"));
      console.log(`${i} session works`); // Making sure everything is going correct
    }
    let dataArray = []; // To save the necessary information about each drink.
    for (let i = 0; i < result.length; i++) {
      const info = result[i].data.drinks;
      if (info) {
        console.log("info is real");
        const dataObj = {
          // We create an object for each drink with only the necessar information that we need.
          id: info[0].idDrink, //we get single element arrays on every request.
          image: info[0].strDrinkThumb, //that is why we need to specify the index 0.
          drink: info[0].strDrink,
          category: info[0].strCategory,
        };
        dataArray.push(dataObj);
      } else if (!info) {
        continue;
      }
      // Turning JSON object into a string
      console.log(JSON.stringify(result[i].data.drinks[0].strDrink));
    }
    res.render("index.ejs", { data: dataArray, listTitle: "Random Drinks" });
  } catch (error) {
    res.status(404).send(error.message);
  }
});

// Getting details about the clicked or searched by id drink
app.get("/cocktail/:id", async (req, res) => {
  //Recieving the drink id from the index.ejs file
  let cocktailId = req.params.id;
  console.log(cocktailId);
  try {
    const result = await axios.get(API_URL + "lookup.php?i=" + cocktailId);
    let info = result.data.drinks;
    if (info) {
      let drink = result.data.drinks[0];
      let consistanceArray = []; //Array for the ingredeints together with the measures
      let measure;
      let ingredient;
      for (let i = 1; i <= 15; i++) {
        //strIngredient1...strIngredeint15.

        measure = drink["strMeasure" + i];
        ingredient = drink["strIngredient" + i];
        if (!measure) {
          //There are measureless ingredients so in this case we need empty space.
          measure = "";
        }
        if (!ingredient) {
          //If the ingredients are no more we end the for cycle.
          break;
        }
        const consistance = {
          // Object of the measure and ingredient.
          measure: measure,
          ingredient: ingredient,
        };
        consistanceArray.push(consistance); //Filling the array with the measure and ingreadient object.
      }

      const drinkData = {
        // The final drink object with the necessary data.
        id: cocktailId,
        drink: drink.strDrink,
        category: drink.strCategory,
        alcoholic: drink.strAlcoholic,
        glass: drink.strGlass,
        instructions: drink.strInstructions,
        image: drink.strDrinkThumb,
        consistance: consistanceArray,
      };
      res.render("drink", {
        data: drinkData,
        error: null,
      });
      console.log(drinkData);
    } else {
      res.render("drink.ejs", {
        data: null,
        error: "No drink found with the specified ID",
      });
    }
  } catch (error) {
    res.status(404).send(error.message);
    console.log(error.message);
  }
});

app.post("/search", async (req, res) => {
  try {
    const result = await axios.get(API_URL + "search.php", {
      params: {
        s: req.body.search,
      },
    });
    const info = result.data.drinks;
    if (info) {
      console.log("info is real");
      const dataArray = [];
      for (let i = 0; i < info.length; i++) {
        const dataObj = {
          id: info[i].idDrink,
          image: info[i].strDrinkThumb,
          drink: info[i].strDrink,
          category: info[i].strCategory,
        };
        dataArray.push(dataObj);

        console.log(info[i].strDrinkThumb);
        console.log(info[i].strDrink);
        console.log(info[i].strCategory);
      }
      res.render("index", {
        data: dataArray,
        listTitle: _.upperFirst(req.body.search) + " Drinks",
      });
      console.log(dataArray);
    } else {
      res.render("index.ejs", { data: null });
    }
  } catch (error) {
    console.log(error.message);
    res.status(404).send(error.message);
  }
});

app.get("/about", (req, res) => {
  res.render("about.ejs");
});

app.listen(port, () => {
  console.log(`Listening to ${port}`);
});
