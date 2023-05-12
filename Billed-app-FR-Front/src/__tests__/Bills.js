/**
 * @jest-environment jsdom
 */

import { fireEvent, screen, waitFor } from "@testing-library/dom";
import BillsUI from "../views/BillsUI.js";
import Bills from "../containers/Bills.js";
import { bills } from "../fixtures/bills.js";
import { ROUTES_PATH, ROUTES } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store";
import router from "../app/Router.js";
import { formatDate, formatStatus } from "../app/format.js";

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);
      await waitFor(() => screen.getByTestId("icon-window"));
      const windowIcon = screen.getByTestId("icon-window");
      // Check if icon is highlighted by having active-icon class
      expect(windowIcon.classList).toContain("active-icon");
    });
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills });
      const dates = screen
        .getAllByText(
          /^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i
        )
        .map((a) => a.innerHTML);
      const antiChrono = (a, b) => (a < b ? 1 : -1);
      // Check if dates are sorted from latest to earliest by using antiChrono function
      const datesSorted = [...dates].sort(antiChrono);
      expect(dates).toEqual(datesSorted);
    });

    describe("When i click New bill button", () => {
      test("Then it should open newBills pages", () => {
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

        const store = jest.fn();
        // Create a new instance of Bills
        const billsContainer = new Bills({
          document,
          onNavigate,
          store,
          localStorage: window.localStorage,
        });

        //Load BillsUI in the HTML body
        document.body.innerHTML = BillsUI({ data: bills });

        // Mock handleClickNewBill function
        const handleClickNewBillMock = jest.fn(
          billsContainer.handleClickNewBill
        );
        const newBillButton = screen.getByTestId("btn-new-bill");
        handleClickNewBillMock(newBillButton);

        //Launch handleClickNewBill function when clicking on newBillButton
        fireEvent.click(newBillButton);

        // Check if handleClickNewBill function has been called and DOM has been updated
        expect(handleClickNewBillMock).toHaveBeenCalled();
        expect(screen.getByText("Envoyer une note de frais")).toBeTruthy();
      });
    });

    describe("When i click eye icon", () => {
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };
      test("Then it should open bills modals", () => {
        // Create a new instance of Bills
        const billsContainer = new Bills({
          document,
          onNavigate,
          store: null,
          localStorage: window.localStorage,
        });

        //Load BillsUI in the HTML body
        document.body.innerHTML = BillsUI({ data: bills });

        // Mock handleClickIconEye function
        const handleClickIconEye = jest.fn((icon) =>
          billsContainer.handleClickIconEye(icon)
        );

        // Get all eye icons and launch handleClickIconEye function when clicking on each icon
        const iconEye = screen.getAllByTestId("icon-eye");
        const modaleFile = document.getElementById("modaleFile");
        $.fn.modal = jest.fn(() => modaleFile.classList.add("show"));

        iconEye.forEach((icon) => {
          icon.addEventListener("click", handleClickIconEye(icon));
          fireEvent.click(icon);
          expect(handleClickIconEye).toHaveBeenCalled();
        });

        // Check if handleClickIconEye function has been called and DOM has been updated
        expect(modaleFile.classList).toContain("show");
      });

      test("Then the modal should be displayed", () => {
        // Create a new instance of Bills
        const billsContainer = new Bills({
          document,
          onNavigate,
          store: null,
          localStorage: window.localStorage,
        });

        //Load BillsUI in the HTML body
        document.body.innerHTML = BillsUI({ data: bills });

        // Get the first eye icon and launch handleClickIconEye function when clicking on it
        const iconEye = document.querySelector(`div[data-testid="icon-eye"]`);
        $.fn.modal = jest.fn();
        billsContainer.handleClickIconEye(iconEye);
        expect(document.querySelector(".modal")).toBeTruthy();
      });
    });
  });

  describe("getBills", () => {
    const onNavigate = (pathname) => {
      document.body.innerHTML = ROUTES({ pathname });
    };

    // Create a new instance of Bills
    const billsContainer = new Bills({
      document,
      onNavigate,
      store: mockStore,
      localStorage: window.localStorage,
    });

    test("it should return formated Date and status", async () => {
      // Mock getBills function
      const billsToDisplay = await billsContainer.getBills();

      // Retrieve bills from mockStore
      const mockedBills = await mockStore.bills().list();

      // Check if bill has a formated date and status
      expect(billsToDisplay[0].date).toEqual(formatDate(mockedBills[0].date));
      expect(billsToDisplay[0].status).toEqual(
        formatStatus(mockedBills[0].status)
      );
    });

    test("it should return undefined if this.store is undefined", async () => {
      // Create a new instance of Bills with undefined store
      const undefinedBillsContainer = new Bills({
        document,
        onNavigate,
        store: undefined,
        localStorage: window.localStorage,
      });

      // Mock getBills function and check if it returns undefined
      const billsToDisplay = await undefinedBillsContainer.getBills();
      expect(billsToDisplay).toBeUndefined();
    });
  });

  describe("When I fetch all date", () => {
    test("No error occurs then all bills should be displayed", async () => {
      // Set localStorage with user info
      localStorage.setItem(
        "user",
        JSON.stringify({ type: "Employee", email: "a@a" })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);

      // Wait for bills to be displayed
      await waitFor(() => screen.getByText("Mes notes de frais"));
      const allBills = screen.getByTestId("tbody").children;
      const result = screen.getByText("test1");

      // Check if all 4 bills are displayed
      expect(result).toBeTruthy();
      expect(allBills.length).toBe(4);
    });

    describe("Error appends on fetch", () => {
      // Mock store.bills function before each test to throw an error when called and define localStorage with user info
      beforeEach(() => {
        jest.spyOn(mockStore, "bills");
        Object.defineProperty(window, "localStorage", {
          value: localStorageMock,
        });
        window.localStorage.setItem(
          "user",
          JSON.stringify({
            type: "Employee",
            email: "a@a",
          })
        );
        const root = document.createElement("div");
        root.setAttribute("id", "root");
        document.body.appendChild(root);
        router();
      });
      test("It is a 500 error Then error page should be displayed", async () => {
        // Mock store.bills function to throw an error when called and check if error page is displayed with the right error message 500
        mockStore.bills.mockImplementationOnce(() => {
          throw new Error("Erreur 500");
        });
        document.body.innerHTML = BillsUI({ error: "Erreur 500" });
        const error = screen.getByText(/Erreur 500/);
        expect(error).toBeTruthy();
      });

      test("It is a 404 error", async () => {
        // Mock store.bills function to throw an error when called and check if error page is displayed with the right error message 404
        mockStore.bills.mockImplementationOnce(() => {
          throw new Error("Erreur 404");
        });
        document.body.innerHTML = BillsUI({ error: "Erreur 404" });
        const error = screen.getByText(/Erreur 404/);
        expect(error).toBeTruthy();
      });
    });
  });
});
