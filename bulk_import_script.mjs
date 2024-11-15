var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import fs from "fs";
import csv from "csv-parser";
import { db } from "./src/app/db/lib/drizzle"; // Ensure this points to your Drizzle setup
import { laborData } from "./src/app/db/schema";
function bulkImport(filePath) {
    return __awaiter(this, void 0, void 0, function () {
        var records;
        var _this = this;
        return __generator(this, function (_a) {
            records = [];
            return [2 /*return*/, new Promise(function (resolve, reject) {
                    fs.createReadStream(filePath)
                        .pipe(csv())
                        .on("data", function (row) {
                        var record = {
                            lastName: row["Last Name"],
                            firstName: row["First Name"],
                            eid: parseInt(row["EID"], 10),
                            day: row["Day"],
                            date: row["Date"],
                            projectName: row["Project Name"],
                            jobNumber: row["Job #"],
                            costCodeDivision: row["Cost Code Division"],
                            costCodeNumber: row["Cost Code #"],
                            costCodeDescription: row["Cost Code Description"],
                            classification: row["Classification"],
                            shift: row["Shift"],
                            payType: row["Pay Type"],
                            hours: row["Hours"],
                            startTime: row["Start Time"],
                            endTime: row["End Time"],
                            breaks: parseInt(row["Breaks"], 10),
                            mealBreaks: parseInt(row["Meal Breaks"], 10),
                            totalBreakTime: row["Total Break Time"],
                            workLogName: row["WorkLog Name"],
                            payrollNotes: row["Payroll Notes"],
                            payrollAttachments: row["Payroll Attachments"],
                            createdAt: new Date(),
                            updatedAt: new Date(),
                        };
                        records.push(record);
                    })
                        .on("end", function () { return __awaiter(_this, void 0, void 0, function () {
                        var _i, records_1, record, error_1;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 5, , 6]);
                                    _i = 0, records_1 = records;
                                    _a.label = 1;
                                case 1:
                                    if (!(_i < records_1.length)) return [3 /*break*/, 4];
                                    record = records_1[_i];
                                    return [4 /*yield*/, db.insert(laborData).values(record)];
                                case 2:
                                    _a.sent();
                                    _a.label = 3;
                                case 3:
                                    _i++;
                                    return [3 /*break*/, 1];
                                case 4:
                                    console.log("Bulk import of ".concat(records.length, " records completed."));
                                    resolve();
                                    return [3 /*break*/, 6];
                                case 5:
                                    error_1 = _a.sent();
                                    console.error("Error inserting records:", error_1);
                                    reject(error_1);
                                    return [3 /*break*/, 6];
                                case 6: return [2 /*return*/];
                            }
                        });
                    }); })
                        .on("error", function (error) {
                        console.error("Error reading CSV file:", error);
                        reject(error);
                    });
                })];
        });
    });
}
// Run the bulk import for the initial historical data
bulkImport("c:/dev/import.csv")
    .then(function () {
    console.log("Bulk import completed successfully.");
})
    .catch(function (error) {
    console.error("Bulk import failed:", error);
});
