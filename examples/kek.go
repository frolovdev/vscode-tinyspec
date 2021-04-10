type Salary struct {
	Basic, HRA, TA string
}

type Employee struct {
	FirstName, LastName, Email string
	Age                        int
	MonthlySalary              []Salary
}