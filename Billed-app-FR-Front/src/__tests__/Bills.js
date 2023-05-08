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
      expect(windowIcon.classList).toContain("active-icon"); // to-do write expect
    });
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills });
      const dates = screen
        .getAllByText(
          /^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i
        )
        .map((a) => a.innerHTML);
      const antiChrono = (a, b) => (a < b ? 1 : -1);
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

        const billsContainer = new Bills({
          document,
          onNavigate,
          store,
          localStorage: window.localStorage,
        });

        document.body.innerHTML = BillsUI({ data: bills });

        const spy = jest.fn(billsContainer.handleClickNewBill);
        const newBillButton = screen.getByTestId("btn-new-bill");
        spy(newBillButton);
        fireEvent.click(newBillButton);

        expect(spy).toHaveBeenCalled();
        expect(screen.getByText("Envoyer une note de frais")).toBeTruthy();
      });
    });

    describe("When i click eye icon", () => {
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };
      test("Then it should open bills modals", () => {
        const billsContainer = new Bills({
          document,
          onNavigate,
          store: null,
          localStorage: window.localStorage,
        });

        document.body.innerHTML = BillsUI({ data: bills });

        const handleClickIconEye = jest.fn((icon) =>
          billsContainer.handleClickIconEye(icon)
        );
        const iconEye = screen.getAllByTestId("icon-eye");
        const modaleFile = document.getElementById("modaleFile");
        $.fn.modal = jest.fn(() => modaleFile.classList.add("show"));

        iconEye.forEach((icon) => {
          icon.addEventListener("click", handleClickIconEye(icon));
          fireEvent.click(icon);
          expect(handleClickIconEye).toHaveBeenCalled();
        });

        expect(modaleFile.classList).toContain("show");
      });

      test("Then the modal should be displayed", () => {
        document.body.innerHTML = BillsUI({ data: bills });
        const billsContainer = new Bills({
          document,
          onNavigate,
          store: null,
          localStorage: window.localStorage,
        });

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
    const billsContainer = new Bills({
      document,
      onNavigate,
      store: mockStore,
      localStorage: window.localStorage,
    });

    test("it should return formated Date and status", async () => {
      const billsToDisplay = await billsContainer.getBills();
      const mockedBills = await mockStore.bills().list();
      billsToDisplay.forEach((bill, index) => {
        expect(bill.date).toEqual(formatDate(mockedBills[index].date));
        expect(bill.status).toEqual(formatStatus(mockedBills[index].status));
      });
    });
    test("it should return undefined if this.store is undefined", async () => {
      const undefinedBillsContainer = new Bills({
        document,
        onNavigate,
        store: undefined,
        localStorage: window.localStorage,
      });

      const billsToDisplay = await undefinedBillsContainer.getBills();
      expect(billsToDisplay).toBeUndefined();
    });
  });

  jest.mock("../app/store", () => {
    return mockStore;
  });

  describe("When I fetch all date", () => {
    test("No error occurs then all bills should be displayed", async () => {
      localStorage.setItem(
        "user",
        JSON.stringify({ type: "Employee", email: "a@a" })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);

      await waitFor(() => screen.getByText("Mes notes de frais"));
      const allBills = screen.getByTestId("tbody").children;
      const result = screen.getByText("test1");
      expect(result).toBeTruthy();
      expect(allBills.length).toBe(4);
    });

    describe("Error appends on fetch", () => {
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
        mockStore.bills.mockImplementationOnce(() => {
          throw new Error("Erreur 500");
        });
        document.body.innerHTML = BillsUI({ error: "Erreur 500" });
        const error = screen.getByText(/Erreur 500/);
        expect(error).toBeTruthy();
      });

      test("It is a 404 error", async () => {
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
