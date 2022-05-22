import { Form, FormInstance, Input, Modal } from "antd";
import ProjectList from "lib/projectList";
import web3 from "lib/web3";
import { AppContext, ProjectContext } from "pages/context";
import React, { useContext, useRef } from "react";

const layout = {
  labelCol: { span: 6 },
  wrapperCol: { span: 18 },
};

interface IProps {
  visible: boolean;
  setVisible: (val: boolean) => void;
}

export const CreateProject = ({ visible, setVisible }: IProps) => {
  const { dispatch } = useContext(ProjectContext);

  const { account } = useContext(AppContext);
  const formRef = useRef<FormInstance | null>(null);

  const onCancel = () => {
    setVisible(false);
  };

  const afterClose = () => {
    formRef.current && formRef.current.resetFields();
  };

  const onSure = async () => {
    formRef.current && formRef.current.submit();
  };

  const onFinish = async (values: Project) => {
    const minInvestInWei = web3.utils.toWei(values.minInvest, "ether");
    const maxInvestInWei = web3.utils.toWei(values.maxInvest, "ether");
    const goalInWei = web3.utils.toWei(values.goal, "ether");

    setVisible(false);
    dispatch({ type: "createing" });

    try {
      await ProjectList.methods
        .createProject(values.description, minInvestInWei, maxInvestInWei, goalInWei)
        .send({ from: account, gas: "5000000" });

      const address = await ProjectList.methods.getCreatedProject().call();

      dispatch({
        type: "success",
        msg: "创建成功",
        payload: {
          address,
          description: values.description,
          minInvest: minInvestInWei,
          maxInvest: maxInvestInWei,
          goal: goalInWei,
          balance: "0",
          investorCount: "0",
          paymentsCount: "0",
          owner: account,
        },
      });
    } catch (error) {
      dispatch({ type: "failed", msg: error.message });
    }
  };

  return (
    <Modal title="创建项目" visible={visible} onOk={onSure} onCancel={onCancel} afterClose={afterClose}>
      <Form {...layout} name="basic" ref={formRef} labelAlign="right" onFinish={onFinish}>
        <Form.Item label="项目名称" name="description" rules={[{ required: true, message: "请输入项目名称" }]}>
          <Input autoComplete="off" />
        </Form.Item>
        <Form.Item label="最小募资金额" name="minInvest" rules={[{ required: true, message: "请输入最小募资金额" }]}>
          <Input type="number" suffix="ETH" />
        </Form.Item>
        <Form.Item
          label="最大募资金额"
          dependencies={["minInvest"]}
          name="maxInvest"
          rules={[
            { required: true, message: "请输入最大募资金额" },
            ({ getFieldValue }) => ({
              validator(_, value) {
                const minInvest = getFieldValue("minInvest");

                if (Number(value) >= Number(minInvest ? minInvest : 0)) {
                  return Promise.resolve();
                }

                if (!Boolean(value)) {
                  return Promise.resolve();
                }

                return Promise.reject(new Error("不能低于最小募资金额"));
              },
            }),
          ]}
        >
          <Input type="number" suffix="ETH" />
        </Form.Item>
        <Form.Item
          label="募资上限"
          name="goal"
          dependencies={["maxInvest"]}
          rules={[
            { required: true, message: "请输入募资上限" },
            ({ getFieldValue }) => ({
              validator(_, value) {
                const maxInvest = getFieldValue("maxInvest");

                if (Number(value) >= Number(maxInvest ? maxInvest : 0)) {
                  return Promise.resolve();
                }

                if (!Boolean(value)) {
                  return Promise.resolve();
                }

                return Promise.reject(new Error("不能低于最大募资金额"));
              },
            }),
          ]}
        >
          <Input type="number" suffix="ETH" />
        </Form.Item>
      </Form>
    </Modal>
  );
};
