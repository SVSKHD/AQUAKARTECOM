import AquaSoftenerHyderabadComponent from "@/pageComponents/softenersHyderabad";
import AquaSoftnerOperations from "@/services/softenersHyderabad";

const AquaSoftenersHyderabad = ({ initialSections, initialError }) => (
  <AquaSoftenerHyderabadComponent
    initialSections={initialSections}
    initialError={initialError}
  />
);

export const getServerSideProps = async () => {
  try {
    const response = await AquaSoftnerOperations.getSofteners();
    const sections = Array.isArray(response?.data) ? response.data : [];

    return {
      props: {
        initialSections: sections,
        initialError: "",
      },
    };
  } catch (error) {
    console.error(
      "Failed to fetch Hyderabad softeners on the server:",
      error?.message || error,
    );

    return {
      props: {
        initialSections: [],
        initialError:
          "We couldn’t load the installation gallery right now. Please try again in a moment.",
      },
    };
  }
};

export default AquaSoftenersHyderabad;
