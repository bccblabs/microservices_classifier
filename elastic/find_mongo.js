conn = new Mongo();
db = conn.getDB("vehicle_data")

// cursor = db.equipments.find().limit("20");
cursor = db.style_infos.find({$where: 'this.options.length > 1'}, {'options': 1}).limit(50);
while (cursor.hasNext()) {
    printjson (cursor.next());
}
