const express = require('express');
const fs = require('fs');
const app = express();
const path = require('path');
const fileToPath = path.join(__dirname,'db.json')
const data = JSON.parse(fs.readFileSync(fileToPath, 'utf-8'));
const products = data;

// async function readfile() {
//     const data = fs.readFileSync(fileToPath, "utf-8");
//     return JSON.parse(data);
// }


async function readfilewithdelay(){
    await new Promise((resolve , reject) => {setTimeout(resolve , 1500)})
    let products = await readfile();
    return products;
}


app.get("/products", async (req, res) => {
    try {

        const products = await readfilewithdelay();

        res.json(products);

    } catch (err) {

        console.log(err);

    }

});
app.get("/products/:id",(req,res) => {
    const id = Number(req.params.id)
    const find = products.find((x) => x.id == id)
    if(!find){
        return res.status(404).json({
            message: "Product not found"
        })
    }
    res.json(find)
})
app.listen(3000, () => {
    console.log("Server running on port 3000")
})