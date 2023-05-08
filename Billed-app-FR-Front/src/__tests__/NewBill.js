/**
 * @jest-environment jsdom
 */

import { fireEvent, screen } from "@testing-library/dom";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import { ROUTES, ROUTES_PATH } from "../constants/routes";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store.js";
import userEvent from "@testing-library/user-event";

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
      const html = NewBillUI();
      document.body.innerHTML = html;
      const title = screen.getAllByText("Envoyer une note de frais");
      const sendBtn = screen.getAllByText("Envoyer");
      const form = document.querySelector("form");
      expect(title).toBeTruthy();
      expect(sendBtn).toBeTruthy();
      expect(form.length).toEqual(9);
    });

    describe("When I upload an image file", () => {
      beforeEach(() => {
        // DOM Init
        document.body.innerHTML = NewBillUI();
      });
      test("Then the file input should display a file", () => {
        const newBillContainer = new NewBill({
          document,
          onNavigate,
          store: mockStore,
          localStorage: window.localStorage,
        });

        const handleFileChange = jest.fn(newBillContainer.handleChangeFile);
        const file = screen.getByTestId("file");
        file.addEventListener("change", handleFileChange);
        // user upload available file
        userEvent.upload(
          file,
          new File(["test"], "test.png", { type: "image/png" })
        );

        expect(handleFileChange).toHaveBeenCalled();
        expect(file.files[0].name).toBe("test.png");
        expect(file.files).toHaveLength(1);
      });
      test("It should display an error message if the file has not an available extension", () => {
        const newBillContainer = new NewBill({
          document,
          onNavigate,
          store: mockStore,
          localStorage: window.localStorage,
        });
        const errorMessage = screen.getByTestId("file-error");
        const handleFileChange = jest.fn(newBillContainer.handleChangeFile);
        const file = screen.getByTestId("file");
        file.addEventListener("change", handleFileChange);

        // user upload not available file
        userEvent.upload(
          file,
          new File(["test"], "test.txt", { type: "text/plain" })
        );

        // check if error-message is displayed
        expect(errorMessage.classList.contains("active")).toBe(true);
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

    // create a valid bill
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

    fireEvent.submit(submitForm);

    // check if the handleSubmit function is called
    expect(handleSubmit).toHaveBeenCalled();
  });
  test("Then it should save the bill", async () => {
    const onNavigate = (pathname) => {
      document.body.innerHTML = ROUTES({ pathname });
    };

    Object.defineProperty(window, "localStorage", {
      value: localStorageMock,
    });
    window.localStorage.setItem(
      "user",
      JSON.stringify({
        type: "Employee",
      })
    );

    const html = NewBillUI();
    document.body.innerHTML = html;

    const newBillContainer = new NewBill({
      document,
      onNavigate,
      store: null,
      localStorage: window.localStorage,
    });

    const formNewBill = screen.getByTestId("form-new-bill");
    expect(formNewBill).toBeTruthy();

    const handleSubmit = jest.fn((e) => newBillContainer.handleSubmit(e));
    formNewBill.addEventListener("submit", handleSubmit);
    fireEvent.submit(formNewBill);
    expect(handleSubmit).toHaveBeenCalled();
  });

  // check file is uploaded on submit
  test("Then the file bill should be uploaded", async () => {
    jest.spyOn(mockStore, "bills");

    const onNavigate = (pathname) => {
      document.body.innerHTML = ROUTES({ pathname });
    };

    Object.defineProperty(window, "localStorage", {
      value: localStorageMock,
    });
    Object.defineProperty(window, "location", {
      value: { hash: ROUTES_PATH["NewBill"] },
    });
    window.localStorage.setItem(
      "user",
      JSON.stringify({
        type: "Employee",
      })
    );

    const html = NewBillUI();
    document.body.innerHTML = html;

    const newBillContainer = new NewBill({
      document,
      onNavigate,
      store: mockStore,
      localStorage: window.localStorage,
    });

    const file = new File(["image"], "image.png", { type: "image/png" });
    const handleChangeFile = jest.fn((e) =>
      newBillContainer.handleChangeFile(e)
    );
    const formNewBill = screen.getByTestId("form-new-bill");
    const billFile = screen.getByTestId("file");

    billFile.addEventListener("change", handleChangeFile);
    userEvent.upload(billFile, file);

    expect(billFile.files[0].name).toBeDefined();
    expect(handleChangeFile).toBeCalled();

    const handleSubmit = jest.fn((e) => newBillContainer.handleSubmit(e));
    formNewBill.addEventListener("submit", handleSubmit);
    fireEvent.submit(formNewBill);
    expect(handleSubmit).toHaveBeenCalled();
  });
});
