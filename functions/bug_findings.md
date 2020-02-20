1. Sequelize
    * `Datatypes.NUMBER` does not exist in `mysql` dialect. This results in a runtime error on model creation.
    * Attribute `unique` does not work in `SQLite` on `TEXT/STRING` columns.
