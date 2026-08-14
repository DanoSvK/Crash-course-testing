import { useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import styles from "./Form.module.css";
import Button from "./Button";
import BackButton from "./BackButton";
import { useUrlPosition } from "../hooks/useUrlPosition";
import { convertToEmoji } from "../utils/convertToEmoji";
import EmojiToPng from "./EmojiToPng";
import Message from "./Message";
import Spinner from "./Spinner";
import { useCities } from "../contexts/useCities";
import { useNavigate } from "react-router-dom";

const API_KEY = "bdc_c98c90f23018468ba9e8e6943e536004";
const BASE_URL = "https://api.bigdatacloud.net/data/reverse-geocode";

function Form() {
  const [cityName, setCityName] = useState("");
  const [isLoadingGeocoding, setIsLoadingGeocoding] = useState(false);
  const { createCity, isLoading } = useCities();
  const navigate = useNavigate();

  const [country, setCountry] = useState("");
  const [date, setDate] = useState(new Date());
  const [notes, setNotes] = useState("");
  const { lat, lng } = useUrlPosition();
  const [emoji, setEmoji] = useState("");
  const [geocodingError, setGecodingError] = useState();

  useEffect(() => {
    if (!lat && !lng) return;

    async function fetchCityData() {
      try {
        setIsLoadingGeocoding(true);

        const res = await fetch(
          `${BASE_URL}?latitude=${lat}&longitude=${lng}&key=${API_KEY}`,
        );
        const data = await res.json();

        if (!data.countryCode) {
          throw new Error(
            "That doesn't seem to be a city. Click somehwere else.",
          );
        }

        setCityName(
          data.city || data.locality || data.principalSubdivision || "",
        );
        setCountry(data.countryName);
        setEmoji(data.countryCode);
      } catch (err) {
        console.error("Error fetching geocoding data:", err);
        setGecodingError(err.message);
      } finally {
        setIsLoadingGeocoding(false);
      }
    }
    fetchCityData();
  }, [lat, lng]);

  async function handleSubmit(e) {
    e.preventDefault();

    if (!cityName || !date) return;

    const newCity = {
      cityName,
      country,
      emoji,
      date,
      notes,
      position: { lat, lng },
    };

    await createCity(newCity);
    navigate("/app/cities");
  }

  if (isLoadingGeocoding) return <Spinner />;

  if (!lat || !lng) return <Message message="Start by clicking on the map" />;

  if (geocodingError) return <Message message={geocodingError} />;

  return (
    <form
      className={`${styles.form} ${isLoading ? styles.loading : ""}`}
      onSubmit={handleSubmit}
    >
      <div className={styles.row}>
        <label htmlFor="cityName">City name</label>
        <input
          id="cityName"
          onChange={(e) => setCityName(e.target.value)}
          value={cityName}
        />
        <span className={styles.flag}>{EmojiToPng(convertToEmoji(emoji))}</span>
      </div>

      <div className={styles.row}>
        <label htmlFor="date">When did you go to {cityName}?</label>
        {/* <input
          id="date"
          onChange={(e) => setDate(e.target.value)}
          value={date}
        /> */}
      </div>
      <DatePicker
        onChange={(date) => {
          setDate(date);
        }}
        selected={date}
        dateFormat={"dd/MM/yyyy"}
      />
      <div className={styles.row}>
        <label htmlFor="notes ">Notes about your trip to {cityName}</label>
        <textarea
          id="notes"
          onChange={(e) => setNotes(e.target.value)}
          value={notes}
        />
      </div>

      <div className={styles.buttons}>
        <Button type="primary">Add</Button>
        <BackButton />
      </div>
    </form>
  );
}

export default Form;
