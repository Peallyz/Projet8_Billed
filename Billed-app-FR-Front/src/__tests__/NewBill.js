/**
 * @jest-environment jsdom
 */

import { fireEvent, screen } from "@testing-library/dom";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import { ROUTES } from "../constants/routes";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store.js";
import userEvent from "@testing-library/user-event";

// Define LocalStorage with user data as Employee and localStorageMock
Object.defineProperty(window, "localStorage", { value: localStorageMock });
window.localStorage.setItem(
  "user",
  JSON.stringify({
    type: "Employee",
  })
);
const onNavigate = jest.fn();

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    test("Then the NewBill Page should be rendered", () => {
      // Apply NewBillUI to document.body
      document.body.innerHTML = NewBillUI();
      const title = screen.getAllByText("Envoyer une note de frais");
      const sendBtn = screen.getAllByText("Envoyer");
      const form = document.querySelector("form");

      // Check if title, send button and form are rendered with all inputs
      expect(title).toBeTruthy();
      expect(sendBtn).toBeTruthy();
      expect(form.length).toEqual(9);
    });

    describe("When I upload an image file", () => {
      // Apply NewBillUI to document.body before each test
      beforeEach(() => {
        document.body.innerHTML = NewBillUI();
      });

      test("Then the file input should display a file", () => {
        // Create a new instance of NewBill with mockStore
        const newBillContainer = new NewBill({
          document,
          onNavigate,
          store: mockStore,
          localStorage: window.localStorage,
        });

        // Mock handleChangeFile function
        const handleFileChange = jest.fn(newBillContainer.handleChangeFile);
        const file = screen.getByTestId("file");
        const errorMessage = screen.getByTestId("file-error");

        // Add event listener to file input
        file.addEventListener("change", handleFileChange);

        // Upload a file by launching upload event on file input
        userEvent.upload(
          file,
          new File(["test"], "test.png", { type: "image/png" })
        );

        // Check if handleChangeFile has been called and if file input has been changed with the current file
        expect(handleFileChange).toHaveBeenCalled();
        expect(file.files[0].name).toBe("test.png");
        expect(file.files).toHaveLength(1);
      });
      test("It should display an error message if the file has not an available extension", () => {
        // Create a new instance of NewBill with mockStore
        const newBillContainer = new NewBill({
          document,
          onNavigate,
          store: mockStore,
          localStorage: window.localStorage,
        });

        const errorMessage = screen.getByTestId("file-error");
        const handleFileChange = jest.fn(newBillContainer.handleChangeFile);
        const file = screen.getByTestId("file");

        // Add event listener to file input
        file.addEventListener("change", handleFileChange);

        // Upload a wrong file by launching upload event on file input
        userEvent.upload(
          file,
          new File(["test"], "test.txt", { type: "text/plain" })
        );

        // Check if handleChangeFile has been called and if file input has been cleared and if error message is displayed
        expect(errorMessage.classList).toContain("active");
        expect(handleFileChange).toHaveBeenCalled();
        expect(file.files[0].name).toBe("test.txt");
        expect(file.value).toBe("");
      });
    });
  });
});

// POST

describe("When I submit a new valid bill", () => {
  test("Then a new bill should be created", () => {
    // Create a new instance of NewBill with mockStore and apply NewBillUI to document.body
    document.body.innerHTML = NewBillUI();
    const submitForm = screen.getByTestId("form-new-bill");
    const newBillContainer = new NewBill({
      document,
      onNavigate,
      store: mockStore,
      localStorage: window.localStorage,
    });

    const handleSubmit = jest.fn(newBillContainer.handleSubmit);
    submitForm.addEventListener("submit", handleSubmit);

    // Create a new bill object with all inputs values and apply them to the form
    const bill = {
      type: "Transports",
      name: "test",
      date: "2021-09-01",
      amount: 30,
      vat: 10,
      pct: 20,
      commentary: "test text for commentary",
      fileUrl: "test.png",
      fileName: "test.png",
    };

    document.querySelector(`select[data-testid="expense-type"]`).value =
      bill.type;
    document.querySelector(`input[data-testid="expense-name"]`).value =
      bill.name;
    document.querySelector(`input[data-testid="datepicker"]`).value = bill.date;
    document.querySelector(`input[data-testid="amount"]`).value = bill.amount;
    document.querySelector(`input[data-testid="vat"]`).value = bill.vat;
    document.querySelector(`input[data-testid="pct"]`).value = bill.pct;
    document.querySelector(`textarea[data-testid="commentary"]`).value =
      bill.commentary;
    newBillContainer.fileUrl = bill.fileUrl;
    newBillContainer.fileName = bill.fileName;

    // Launch submit event on form
    fireEvent.submit(submitForm);

    // Check if handleSubmit has been called
    expect(handleSubmit).toHaveBeenCalled();
  });

  test("Then the file bill should be uploaded", async () => {
    // Spy on bills method from mockStore
    jest.spyOn(mockStore, "bills");

    const onNavigate = (pathname) => {
      document.body.innerHTML = ROUTES({ pathname });
    };

    // Define LocalStorage with user data as Employee and localStorageMock
    Object.defineProperty(window, "localStorage", {
      value: localStorageMock,
    });

    window.localStorage.setItem(
      "user",
      JSON.stringify({
        type: "Employee",
      })
    );

    // Create a new instance of NewBill with mockStore and apply NewBillUI to document.body
    const html = NewBillUI();
    document.body.innerHTML = html;

    const newBillContainer = new NewBill({
      document,
      onNavigate,
      store: mockStore,
      localStorage: window.localStorage,
    });

    // Create a new file object and apply it to the file input
    const file = new File(["image"], "image.png", { type: "image/png" });
    const handleChangeFile = jest.fn((e) =>
      newBillContainer.handleChangeFile(e)
    );
    const formNewBill = screen.getByTestId("form-new-bill");
    const billFile = screen.getByTestId("file");

    // Add event listener to file input and upload file on it
    billFile.addEventListener("change", handleChangeFile);
    userEvent.upload(billFile, file);

    // Check if handleChangeFile has been called and if file input has been changed with the current file
    expect(billFile.files[0].name).toBeDefined();
    expect(handleChangeFile).toBeCalled();

    const handleSubmit = jest.fn((e) => newBillContainer.handleSubmit(e));
    formNewBill.addEventListener("submit", handleSubmit);
    fireEvent.submit(formNewBill);
    expect(handleSubmit).toHaveBeenCalled();
  });
});
