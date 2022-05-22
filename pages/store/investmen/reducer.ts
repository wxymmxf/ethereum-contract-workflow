import { StoreErrorHandling, StoreSuccessHandling } from "pages/utils";

const reducer = (state: Store.InvestmentStore, action: Store.InvestmentStore) => {
  const { type, payload } = action;

  switch (type) {
    case "success":
    case "failed":
      type === "failed" && StoreErrorHandling(action.msg);
      type === "success" && StoreSuccessHandling(action.msg);

      if (payload.length) {
        const index = state.payload.findIndex((v) => v.address === payload[0].address);
        state.payload.splice(index, 1);
      } else {
        StoreErrorHandling("缺少投资项目参数");
      }

      return {
        ...state,
        type,
      };
    case "investing":
      state.payload.push(payload[0]);

      return {
        ...state,
        type,
      };
    default:
      return state;
  }
};

export default reducer;
