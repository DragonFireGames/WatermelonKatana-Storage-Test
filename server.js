const express = require("express");
const path = require("path");
const fs = require("fs");
const WatermelonKatanaStorage = require("./public/wkstorage.js");

const project = JSON.parse(fs.readFileSync('.editor/project.json', 'utf8'));
console.log("Project is: "+project.id);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(process.cwd(), "public")));

function getStorage(req) {
  return new WatermelonKatanaStorage(req.params.id);
}

function handle(handler) {
  return async (req, res) => {
    try {
      res.json(await handler(req, res));
    } catch (error) {
      res.status(400).json({ error: error?.message || String(error) });
    }
  };
}

// These routes deliberately mirror the WatermelonKatanaStorage browser client's
// backend requests. The index page uses the same storage-shaped interface in
// both modes, so the UI is independent of the implementation.
app.get("/api/getid", handle(async()=>project));
app.post("/api/storage/:id/create", handle(async (req) => {
  await getStorage(req).create(req.body || {});
  return { success: true };
}));
app.get("/api/storage/:id/get_key_values", handle(req => getStorage(req).getKeyValues()));
app.get("/api/storage/:id/get_key_value", handle(req => getStorage(req).getKeyValue(req.query.key)));
app.post("/api/storage/:id/set_key_value", handle(req => getStorage(req).setKeyValue(req.body.key, req.body.value)));
app.delete("/api/storage/:id/delete_key_value", handle(req => getStorage(req).removeKeyValue(req.body.key)));
app.put("/api/storage/:id/populate_key_values", handle(req => getStorage(req).populateKeyValues(req.body.key_values_json)));
app.post("/api/storage/:id/create_table", handle(req => getStorage(req).createTable(req.body.table_name)));
app.get("/api/storage/:id/get_table_names", handle(req => getStorage(req).getTableNames()));
app.delete("/api/storage/:id/delete_table", handle(req => getStorage(req).removeTable(req.body.table_name)));
app.get("/api/storage/:id/read_records", handle(req => getStorage(req).readRecords(req.query.table_name)));
app.post("/api/storage/:id/create_record", handle(req => getStorage(req).createRecord(req.body.table_name, req.body.record_json)));
app.put("/api/storage/:id/update_record", handle(req => getStorage(req).updateRecord(req.body.table_name, req.body.record_json)));
app.delete("/api/storage/:id/delete_record", handle(req => getStorage(req).removeRecord(req.body.table_name, req.body.record_id)));
app.put("/api/storage/:id/populate_tables", handle(req => getStorage(req).populateTables(req.body.tables_json)));
app.post("/api/storage/:id/add_column", handle(req => getStorage(req).addColumn(req.body.table_name, req.body.column_name)));
app.delete("/api/storage/:id/delete_column", handle(req => getStorage(req).removeColumn(req.body.table_name, req.body.column_name)));
app.put("/api/storage/:id/rename_column", handle(req => getStorage(req).renameColumn(req.body.table_name, req.body.old_column_name, req.body.new_column_name)));
app.put("/api/storage/:id/coerce_column", handle(req => getStorage(req).coerceColumn(req.body.table_name, req.body.column_name, req.body.column_type)));
app.get("/api/storage/:id/get_column", handle(req => getStorage(req).getColumn(req.query.table_name, req.query.column_name)));
app.get("/api/storage/:id/get_columns_for_table", handle(req => getStorage(req).getColumnsForTable(req.query.table_name)));
app.get("/api/storage/:id/project_has_data", handle(req => getStorage(req).hasData()));
app.delete("/api/storage/:id/clear_all_data", handle(req => getStorage(req).clearAllData()));
app.get("/api/storage/:id/get_library_manifest", handle(req => getStorage(req).getLibraryManifest()));

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Express server listening on port ${PORT}`);
});

