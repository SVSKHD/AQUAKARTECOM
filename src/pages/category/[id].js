import AquaDynamicCategoryComponent from "@/pageComponents/categories/dynamicCategory";

const DynamicAquaCategory = ({ id }) => {
  return (
    <>
      <AquaDynamicCategoryComponent id={id} />
    </>
  );
};

export async function getServerSideProps(context) {
  const { id } = context.params;

  // You can fetch data using the id here if needed

  return {
    props: {
      id,
    },
  };
}

export default DynamicAquaCategory;
