/**
https://docs.google.com/spreadsheets/d/1rxKseVzYkkteCZWefVlZiRMwzfVLoiB8pFJAwmmGM7Q/edit#gid=526851934
This will need to handle http errors at some point.
The "eslint-disable-next-line no-undef" lines are so my linter (cleans up my code)
doesn't bug me that spreadsheet isn't a real thing, google app script uses it.
*/
// eslint-disable-next-line no-undef
const settingsSheet = SpreadsheetApp.getActive().getSheetByName('Settings')
// eslint-disable-next-line no-undef
const dataSheet = SpreadsheetApp.getActive().getSheetByName('Data')
const tornAPIKey = settingsSheet.getRange('B1').getValues()
const companyIDs = gatherCompanyIDs()

/**
* This function grabs the whole row of A2 from the settings sheet.
* It then verify's that the values in the list are numbers
* If they are not, it filters them out, and then returns the new array
* An array is a list ex: ['CompanyIDs:', '1', '2', '3', '4', '5, '', '', '', '']
* @returns {string[]}
*/
function gatherCompanyIDs () {
  const row = settingsSheet.getRange('A2:2').getValues()[0]
  const filtered = row.filter(function (value) {
    return (typeof value) === 'number'
  })
  return filtered
}

/**
 * This function takes a company id as it's argument or parameter, it must be a string.
 * @param {string} companyID
 * @returns {object}
 */
function callCompany (companyID) {
  // Call the Torn API by a company id
  const url = 'https://api.torn.com/company/' + companyID + '/?selections=&key=' + tornAPIKey
  // eslint-disable-next-line no-undef
  const response = UrlFetchApp.fetch(url)
  const responseJson = JSON.parse(response.getContentText()).company
  // This just verifies the data it got from torn and makes sure it's in json format
  // It then creates a dictionary with all the company's information from the json
  const companyDataDict = {
    daily: responseJson.daily_income.toFixed(0),
    name: responseJson.name,
    staff_size: responseJson.employees_hired.toFixed(0),
    staff: {}
  }
  // This part just goes through employees and grabs each ones position.
  // If that position doesn't exist in the dictionary, add it.
  // If it does exist, add + 1.
  // Then we grab the date and append it to the dictionary, and return the dictionary / object.
  for (const employee in responseJson.employees) {
    const position = responseJson.employees[employee].position
    if (!(position === 'Director')) {
      if (!companyDataDict.staff.position) {
        companyDataDict.staff[position] = 1
      } else {
        companyDataDict.staff[position] += 1
      }
      companyDataDict.staff[position] = companyDataDict.staff[position].toFixed(0)
    }
  }
  const date = gatherDate()
  companyDataDict.date = date
  return companyDataDict
}

/**
 * This function just grabs the current date and returns it as a string.
 * @returns {string}
 */
function gatherDate () {
  const date = new Date()
  const year = date.getYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const datePrint = month + '-' + day + '-' + year
  return datePrint
}
/**
 * This function starts the script.
 * It takes the list of company ID's and create objects/dictionaries of each one.
 * It then appends the object information into the bottom row of the data sheet.
 */
// The line below is here to disable the linter, startScript IS indeed used, by google app script.
// The button actually links to this.
// eslint-disable-next-line no-unused-vars
function startScript () {
  for (const company in companyIDs) {
    const companyID = companyIDs[company].toFixed(0)
    const companyDict = callCompany(companyID)
    const value = [companyDict.date, companyDict.name, companyDict.daily, companyDict.staff_size, companyDict.staff]
    dataSheet.appendRow(value)
  }
}