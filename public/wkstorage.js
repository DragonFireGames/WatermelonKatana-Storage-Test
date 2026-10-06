(function (root, factory) {
  const WatermelonKatanaStorage = factory();

  // CommonJS / Node / your editor npm runtime
  if (typeof module !== "undefined" && module.exports) {
    module.exports = WatermelonKatanaStorage;
    module.exports.WatermelonKatanaStorage = WatermelonKatanaStorage;
  }

  // Normal browser script
  if (root) {
    root.WatermelonKatanaStorage = WatermelonKatanaStorage;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  class WatermelonKatanaStorage {
    static domain = globalThis.__hostOrigin || "https://watermelonkatana.onrender.com";

    constructor(id) {
      if (typeof id !== "string" || !/^[\w-]{1,64}$/.test(id)) {
        throw new Error(
          'WatermelonKatanaStorage id must be 1-64 characters and contain only letters, numbers, "_" or "-".'
        );
      }

      this.id = id;
    }

    get domain() {
      return WatermelonKatanaStorage.domain;
    }

    set domain(value) {
      WatermelonKatanaStorage.domain = String(value).replace(/\/+$/, "");
    }

    _url(path) {
      return (
        `${this.domain}/datablock_storage/` +
        `${encodeURIComponent(this.id)}/${path}`
      );
    }

    async _request(path, options = {}) {
      const response = await fetch(this._url(path), {
        ...options,
        headers: {
          ...(options.body !== undefined
            ? { "Content-Type": "application/json" }
            : {}),
          ...(options.headers || {}),
        },
      });

      if (!response.ok) {
        let message = `${response.status} ${response.statusText}`;

        try {
          const error = await response.json();
          if (error?.Error) {
            message = error.Error;
          }
        } catch (_) {}

        throw new Error(
          `WatermelonKatanaStorage request failed: ${message}`
        );
      }

      return response;
    }

    async _json(path, options = {}) {
      return await (await this._request(path, options)).json();
    }

    // ----------------------------------------------------------
    // Initialization
    // ----------------------------------------------------------

    async create(initial = {}) {
      // The first request causes the backend storage object to exist.
      await this.getKeyValues();

      if (
        initial &&
        initial.keyValues &&
        typeof initial.keyValues === "object"
      ) {
        await this.populateKeyValues(initial.keyValues);
      }

      if (
        initial &&
        initial.tables &&
        typeof initial.tables === "object"
      ) {
        await this.populateTables(initial.tables);
      }

      return this;
    }

    // ----------------------------------------------------------
    // Key/value storage
    // ----------------------------------------------------------

    async setKeyValue(key, value) {
      return await this._json("set_key_value", {
        method: "POST",
        body: JSON.stringify({
          key,
          value,
        }),
      });
    }

    async getKeyValue(key) {
      return await this._json(
        `get_key_value?key=${encodeURIComponent(key)}`
      );
    }

    async getKeyValues() {
      return await this._json("get_key_values");
    }

    async removeKeyValue(key) {
      return await this._json("delete_key_value", {
        method: "DELETE",
        body: JSON.stringify({
          key,
        }),
      });
    }

    async populateKeyValues(keyValues) {
      return await this._json("populate_key_values", {
        method: "PUT",
        body: JSON.stringify({
          key_values_json: JSON.stringify(keyValues),
        }),
      });
    }

    // ----------------------------------------------------------
    // Tables
    // ----------------------------------------------------------

    async createTable(tableName) {
      return await this._json("create_table", {
        method: "POST",
        body: JSON.stringify({
          table_name: tableName,
        }),
      });
    }

    async getTableNames() {
      return await this._json("get_table_names");
    }

    async removeTable(tableName) {
      return await this._json("delete_table", {
        method: "DELETE",
        body: JSON.stringify({
          table_name: tableName,
        }),
      });
    }

    async clearTable(tableName) {
      // There is no clear_table backend endpoint.
      // Replacing the table with no records gives it the same state.
      return await this.populateTables({
        [tableName]: [],
      });
    }

    async readRecords(tableName) {
      return await this._json(
        `read_records?table_name=${encodeURIComponent(tableName)}`
      );
    }

    async createRecord(tableName, record) {
      return await this._json("create_record", {
        method: "POST",
        body: JSON.stringify({
          table_name: tableName,
          record_json: JSON.stringify(record),
        }),
      });
    }

    async updateRecord(tableName, record) {
      return await this._json("update_record", {
        method: "PUT",
        body: JSON.stringify({
          table_name: tableName,
          record_json: JSON.stringify(record),
        }),
      });
    }

    async removeRecord(tableName, recordId) {
      return await this._json("delete_record", {
        method: "DELETE",
        body: JSON.stringify({
          table_name: tableName,
          record_id: recordId,
        }),
      });
    }

    async populateTables(tables) {
      return await this._json("populate_tables", {
        method: "PUT",
        body: JSON.stringify({
          tables_json: JSON.stringify(tables),
        }),
      });
    }

    // ----------------------------------------------------------
    // Columns
    // ----------------------------------------------------------

    async addColumn(tableName, columnName) {
      return await this._json("add_column", {
        method: "POST",
        body: JSON.stringify({
          table_name: tableName,
          column_name: columnName,
        }),
      });
    }

    async removeColumn(tableName, columnName) {
      return await this._json("delete_column", {
        method: "DELETE",
        body: JSON.stringify({
          table_name: tableName,
          column_name: columnName,
        }),
      });
    }

    async renameColumn(tableName, oldColumnName, newColumnName) {
      return await this._json("rename_column", {
        method: "PUT",
        body: JSON.stringify({
          table_name: tableName,
          old_column_name: oldColumnName,
          new_column_name: newColumnName,
        }),
      });
    }

    async coerceColumn(tableName, columnName, columnType) {
      return await this._json("coerce_column", {
        method: "PUT",
        body: JSON.stringify({
          table_name: tableName,
          column_name: columnName,
          column_type: columnType,
        }),
      });
    }

    async getColumn(tableName, columnName) {
      return await this._json(
        `get_column?table_name=${encodeURIComponent(
          tableName
        )}&column_name=${encodeURIComponent(columnName)}`
      );
    }

    async getColumnsForTable(tableName) {
      return await this._json(
        `get_columns_for_table?table_name=${encodeURIComponent(
          tableName
        )}`
      );
    }

    // ----------------------------------------------------------
    // Project-wide storage
    // ----------------------------------------------------------

    async hasData() {
      return await this._json("project_has_data");
    }

    async clearAllData() {
      return await this._json("clear_all_data", {
        method: "DELETE",
      });
    }

    // ----------------------------------------------------------
    // Library compatibility
    // ----------------------------------------------------------

    async getLibraryManifest() {
      return await this._json("get_library_manifest");
    }
  }

  return WatermelonKatanaStorage;
});