/**
 * @jest-environment jsdom
 */

import { fireEvent, screen, waitFor } from "@testing-library/dom";
import BillsUI from "../views/BillsUI.js";
import Bills from "../containers/Bills.js";
import { bills } from "../fixtures/bills.js";
import { ROUTES_PATH, ROUTES } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockedStore from "../__mocks__/store";
import router from "../app/Router.js";

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
  });
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
  test("Then it should open bills modals", () => {
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
});

describe("getBills", async () => {
  const onNavigate = (pathname) => {
    document.body.innerHTML = ROUTES({ pathname });
  };
  const billsContainer = new Bills({
    document,
    onNavigate,
    store: mockedStore,
    localStorage: window.localStorage,
  });

  const spyGetBills = jest.spyOn(billsContainer, "getBills");
  const billsToDisplay = await billsContainer.getBills();
  const mockedBills = await mockedStore.bills().list();
  afterEach(() => {
    // restaure l'espion créé avec spyOn
    jest.restoreAllMocks();
  });

  test("it should display bills if bills are stored", async () => {
    expect(spyGetBills).toHaveBeenCalledTimes(1);
    expect(mockedBills.length).toBe(billsToDisplay.length);
  });

  test("it should return formated Date and status", async () => {
    billsToDisplay.forEach((bill, index) => {
      expect(bill.date).toEqual(formatDate(mockedBills[index].date));
      expect(bill.status).toEqual(formatStatus(mockedBills[index].status));
    });
  });
});
