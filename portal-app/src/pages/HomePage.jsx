import { useEffect, useMemo, useState } from "react";
import Pagination from "../components/Pagination";

function HomePage() {
  const [province, setProvince] = useState("all");
  const [area, setArea] = useState("all");
  const [sport, setSport] = useState("all");
  const [pitchType, setPitchType] = useState("all");
  const [timeSlot, setTimeSlot] = useState("all");
  const [selectedCourt, setSelectedCourt] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [address, setAddress] = useState("");
  const [locationError, setLocationError] = useState("");
  const [userLocation, setUserLocation] = useState(null);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const pageSize = 6;

  const toRadians = (value) => (value * Math.PI) / 180;

  const calculateDistanceKm = (lat1, lng1, lat2, lng2) => {
    const earthRadiusKm = 6371;
    const deltaLat = toRadians(lat2 - lat1);
    const deltaLng = toRadians(lng2 - lng1);
    const radLat1 = toRadians(lat1);
    const radLat2 = toRadians(lat2);

    const a =
      Math.sin(deltaLat / 2) ** 2 +
      Math.cos(radLat1) * Math.cos(radLat2) * Math.sin(deltaLng / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return earthRadiusKm * c;
  };

  const courts = useMemo(
    () => [
      {
        id: 1,
        name: "Sân Cầu Lông Sunrise",
        province: "TP. Hồ Chí Minh",
        area: "Quận 1",
        sport: "Cầu lông",
        type: "5",
        latitude: 10.7757,
        longitude: 106.7004,
        timeSlots: ["06:00 - 08:00", "18:00 - 20:00"],
        price: "180.000đ/giờ",
      },
      {
        id: 2,
        name: "Sân Hoa Phượng",
        province: "TP. Hồ Chí Minh",
        area: "Quận 3",
        sport: "Cầu lông",
        type: "7",
        latitude: 10.7842,
        longitude: 106.6846,
        timeSlots: ["08:00 - 10:00", "19:00 - 21:00"],
        price: "220.000đ/giờ",
      },
      {
        id: 3,
        name: "Sân KDC Riverside",
        province: "TP. Hồ Chí Minh",
        area: "Thủ Đức",
        sport: "Bóng đá",
        type: "5",
        latitude: 10.8497,
        longitude: 106.7638,
        timeSlots: ["05:30 - 07:30", "17:00 - 19:00"],
        price: "160.000đ/giờ",
      },
      {
        id: 4,
        name: "Sân Aloha Sports",
        province: "TP. Hồ Chí Minh",
        area: "Bình Thạnh",
        sport: "Bóng đá",
        type: "7",
        latitude: 10.8071,
        longitude: 106.7094,
        timeSlots: ["09:00 - 11:00", "20:00 - 22:00"],
        price: "240.000đ/giờ",
      },
      {
        id: 5,
        name: "Sân Cầu Lông Lotus",
        province: "TP. Hồ Chí Minh",
        area: "Quận 7",
        sport: "Cầu lông",
        type: "5",
        latitude: 10.7379,
        longitude: 106.7216,
        timeSlots: ["06:30 - 08:30", "18:30 - 20:30"],
        price: "190.000đ/giờ",
      },
      {
        id: 6,
        name: "Sân Thanh Bình",
        province: "TP. Hồ Chí Minh",
        area: "Gò Vấp",
        sport: "Bóng đá",
        type: "7",
        latitude: 10.8384,
        longitude: 106.6652,
        timeSlots: ["07:00 - 09:00", "17:30 - 19:30"],
        price: "210.000đ/giờ",
      },
      {
        id: 7,
        name: "Sân Bình Dương Arena",
        province: "Bình Dương",
        area: "Thủ Dầu Một",
        sport: "Cầu lông",
        type: "5",
        latitude: 10.9794,
        longitude: 106.6531,
        timeSlots: ["06:00 - 08:00", "19:00 - 21:00"],
        price: "150.000đ/giờ",
      },
      {
        id: 8,
        name: "Sân Đồng Nai Sports",
        province: "Đồng Nai",
        area: "Biên Hòa",
        sport: "Bóng đá",
        type: "7",
        latitude: 10.9466,
        longitude: 106.8234,
        timeSlots: ["08:00 - 10:00", "18:00 - 20:00"],
        price: "200.000đ/giờ",
      },
    ],
    [],
  );

  const filteredCourts = useMemo(() => {
    const baseFiltered = courts.filter((court) => {
      const provinceMatch = province === "all" || court.province === province;
      const areaMatch = area === "all" || court.area === area;
      const sportMatch = sport === "all" || court.sport === sport;
      const typeMatch = pitchType === "all" || court.type === pitchType;
      const timeMatch =
        timeSlot === "all" || court.timeSlots.includes(timeSlot);

      return provinceMatch && areaMatch && sportMatch && typeMatch && timeMatch;
    });

    if (!userLocation) {
      return baseFiltered;
    }

    return baseFiltered
      .map((court) => ({
        ...court,
        distanceKm: calculateDistanceKm(
          userLocation.latitude,
          userLocation.longitude,
          court.latitude,
          court.longitude,
        ),
      }))
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }, [area, courts, pitchType, province, sport, timeSlot, userLocation]);

  const totalPages = Math.max(1, Math.ceil(filteredCourts.length / pageSize));
  const paginatedCourts = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredCourts.slice(startIndex, startIndex + pageSize);
  }, [currentPage, filteredCourts]);

  useEffect(() => {
    setCurrentPage(1);
  }, [province, area, sport, pitchType, timeSlot, userLocation]);

  const handleApplyLocation = async () => {
    const trimmedAddress = address.trim();
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_KEY;

    if (!trimmedAddress) {
      setLocationError("Vui lòng nhập địa chỉ.");
      return;
    }

    if (!apiKey) {
      setLocationError("Thiếu API key cho geocoding.");
      return;
    }

    setIsGeocoding(true);
    setLocationError("");

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
          trimmedAddress,
        )}&region=vn&key=${apiKey}`,
      );
      const data = await response.json();

      if (data.status !== "OK" || !data.results?.length) {
        setLocationError("Không tìm thấy địa chỉ phù hợp.");
        return;
      }

      const location = data.results[0].geometry.location;
      setUserLocation({ latitude: location.lat, longitude: location.lng });
    } catch (error) {
      console.warn("Geocoding failed", error);
      setLocationError("Không thể kết nối dịch vụ geocoding.");
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Trình duyệt không hỗ trợ định vị.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setAddress("Vị trí hiện tại");
        setLocationError("");
        setUserLocation({ latitude, longitude });
      },
      () => {
        setLocationError("Không thể lấy vị trí hiện tại.");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
      },
    );
  };

  const openBookingModal = (court) => {
    setSelectedCourt(court);
  };

  const closeBookingModal = () => {
    setSelectedCourt(null);
  };

  return (
    <div className="d-flex flex-column gap-4">
      <section className="bg-white border rounded-4 p-4 p-md-5 shadow-sm">
        <span className="badge text-bg-success-subtle text-success-emphasis mb-3">
          Tìm sân - Đặt sân
        </span>
        <h1 className="display-6 fw-semibold mb-3">
          Đặt sân nhanh chóng, đúng khung giờ bạn muốn
        </h1>
        <p className="text-secondary fs-5 mb-4">
          Chọn tỉnh thành, khu vực, môn thể thao và khung giờ phù hợp. Danh sách
          sân sẽ cập nhật ngay theo bộ lọc của bạn.
        </p>
        <div className="d-flex flex-wrap gap-2">
          <span className="badge text-bg-light border">Sân gần bạn</span>
          <span className="badge text-bg-light border">Đặt lịch linh hoạt</span>
          <span className="badge text-bg-light border">Xác nhận tức thì</span>
        </div>
      </section>

      <section className="bg-white border rounded-4 p-3 p-md-4 shadow-sm">
        <div className="row g-3 align-items-end">
          <div className="col-12 col-md-6 col-lg-3">
            <label className="form-label fw-semibold">Tỉnh thành</label>
            <select
              className="form-select"
              value={province}
              onChange={(event) => setProvince(event.target.value)}
            >
              <option value="all">Tất cả tỉnh thành</option>
              <option value="TP. Hồ Chí Minh">TP. Hồ Chí Minh</option>
              <option value="Bình Dương">Bình Dương</option>
              <option value="Đồng Nai">Đồng Nai</option>
            </select>
          </div>
          <div className="col-12 col-md-6 col-lg-3">
            <label className="form-label fw-semibold">Khu vực</label>
            <select
              className="form-select"
              value={area}
              onChange={(event) => setArea(event.target.value)}
            >
              <option value="all">Tất cả khu vực</option>
              <option value="Quận 1">Quận 1</option>
              <option value="Quận 3">Quận 3</option>
              <option value="Quận 7">Quận 7</option>
              <option value="Bình Thạnh">Bình Thạnh</option>
              <option value="Gò Vấp">Gò Vấp</option>
              <option value="Thủ Đức">Thủ Đức</option>
              <option value="Thủ Dầu Một">Thủ Dầu Một</option>
              <option value="Biên Hòa">Biên Hòa</option>
            </select>
          </div>
          <div className="col-12 col-md-6 col-lg-3">
            <label className="form-label fw-semibold">Môn thể thao</label>
            <select
              className="form-select"
              value={sport}
              onChange={(event) => setSport(event.target.value)}
            >
              <option value="all">Tất cả môn</option>
              <option value="Cầu lông">Cầu lông</option>
              <option value="Bóng đá">Bóng đá</option>
            </select>
          </div>
          <div className="col-12 col-md-6 col-lg-3">
            <label className="form-label fw-semibold">Loại sân</label>
            <select
              className="form-select"
              value={pitchType}
              onChange={(event) => setPitchType(event.target.value)}
            >
              <option value="all">Tất cả loại sân</option>
              <option value="5">Sân 5 người</option>
              <option value="7">Sân 7 người</option>
            </select>
          </div>
          <div className="col-12 col-md-6 col-lg-3">
            <label className="form-label fw-semibold">Khung giờ</label>
            <select
              className="form-select"
              value={timeSlot}
              onChange={(event) => setTimeSlot(event.target.value)}
            >
              <option value="all">Tất cả khung giờ</option>
              <option value="05:30 - 07:30">05:30 - 07:30</option>
              <option value="06:00 - 08:00">06:00 - 08:00</option>
              <option value="06:30 - 08:30">06:30 - 08:30</option>
              <option value="07:00 - 09:00">07:00 - 09:00</option>
              <option value="08:00 - 10:00">08:00 - 10:00</option>
              <option value="09:00 - 11:00">09:00 - 11:00</option>
              <option value="17:00 - 19:00">17:00 - 19:00</option>
              <option value="17:30 - 19:30">17:30 - 19:30</option>
              <option value="18:00 - 20:00">18:00 - 20:00</option>
              <option value="18:30 - 20:30">18:30 - 20:30</option>
              <option value="19:00 - 21:00">19:00 - 21:00</option>
              <option value="20:00 - 22:00">20:00 - 22:00</option>
            </select>
          </div>
          <div className="col-12">
            <label className="form-label fw-semibold">Vị trí hiện tại</label>
            <div className="row g-2 align-items-center">
              <div className="col-12 col-lg-6">
                <input
                  className="form-control"
                  placeholder="Nhập địa chỉ (ví dụ: Quận 1, TP. HCM)"
                  value={address}
                  onChange={(event) => setAddress(event.target.value)}
                />
              </div>
              <div className="col-12 col-lg-6 d-flex gap-2">
                <button
                  className="btn btn-outline-primary w-100"
                  type="button"
                  onClick={handleUseCurrentLocation}
                  disabled={isGeocoding}
                >
                  Dùng vị trí hiện tại
                </button>
                <button
                  className="btn btn-primary w-100"
                  type="button"
                  onClick={handleApplyLocation}
                  disabled={isGeocoding}
                >
                  {isGeocoding ? "Đang tìm..." : "Tìm sân gần nhất"}
                </button>
              </div>
            </div>
            <div className="form-text">
              Nhập địa chỉ hoặc dùng GPS để sắp xếp sân theo khoảng cách gần
              nhất. nhất.
            </div>
            {locationError && (
              <div className="text-danger small mt-1">{locationError}</div>
            )}
          </div>
        </div>
      </section>

      <section className="d-flex flex-column gap-3">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
          <h2 className="h5 mb-0">Danh sách sân phù hợp</h2>
          <span className="text-secondary small">
            {filteredCourts.length} sân khả dụng
          </span>
        </div>
        {userLocation && (
          <div className="text-success-emphasis small">
            Đang sắp xếp theo khoảng cách từ vị trí của bạn.
          </div>
        )}

        {filteredCourts.length === 0 ? (
          <div className="bg-white border rounded-4 p-4 text-center text-secondary">
            Không tìm thấy sân phù hợp với bộ lọc hiện tại.
          </div>
        ) : (
          <>
            <div className="row g-4">
              {paginatedCourts.map((court) => (
                <div key={court.id} className="col-12 col-md-6 col-xl-4">
                  <div className="card shadow-sm h-100">
                    <div className="card-body d-flex flex-column gap-3">
                      <div className="d-flex justify-content-between gap-3">
                        <div>
                          <p className="text-secondary text-uppercase small mb-1 fw-semibold">
                            {court.province} · {court.area}
                          </p>
                          <h3 className="h5 mb-0">{court.name}</h3>
                        </div>
                        <span className="badge text-bg-light border align-self-start">
                          {court.sport} · {court.type} người
                        </span>
                      </div>
                      {court.distanceKm != null && (
                        <div className="text-secondary small">
                          Cách bạn khoảng {court.distanceKm.toFixed(1)} km
                        </div>
                      )}
                      <div>
                        <p className="mb-2 text-secondary small">
                          Khung giờ trống
                        </p>
                        <div className="d-flex flex-wrap gap-2">
                          {court.timeSlots.map((slot) => (
                            <span
                              key={slot}
                              className="badge rounded-pill text-bg-light border"
                            >
                              {slot}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="d-flex justify-content-between align-items-center mt-auto">
                        <div>
                          <p className="mb-0 text-secondary small">
                            Giá tham khảo
                          </p>
                          <div className="fw-semibold fs-5">{court.price}</div>
                        </div>
                        <button
                          className="btn btn-primary"
                          type="button"
                          onClick={() => openBookingModal(court)}
                        >
                          Đặt ngay
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </>
        )}
      </section>

      {selectedCourt && (
        <>
          <div className="modal fade show d-block" role="dialog" aria-modal>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h3 className="modal-title h5">Xác nhận đặt sân</h3>
                  <button
                    className="btn-close"
                    type="button"
                    aria-label="Đóng"
                    onClick={closeBookingModal}
                  />
                </div>
                <div className="modal-body">
                  <div className="border rounded-3 p-3 mb-3">
                    <p className="mb-1 fw-semibold">{selectedCourt.name}</p>
                    <p className="mb-1 text-secondary">
                      Khu vực: {selectedCourt.area}
                    </p>
                    <p className="mb-1 text-secondary">
                      Loại sân: {selectedCourt.type} người
                    </p>
                    <p className="mb-0 text-secondary">
                      Giá tham khảo: {selectedCourt.price}
                    </p>
                  </div>
                  <label className="form-label fw-semibold">
                    Chọn khung giờ
                  </label>
                  <select className="form-select" defaultValue="">
                    <option value="" disabled>
                      Chọn khung giờ trống
                    </option>
                    {selectedCourt.timeSlots.map((slot) => (
                      <option key={slot} value={slot}>
                        {slot}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="modal-footer">
                  <button
                    className="btn btn-outline-secondary"
                    type="button"
                    onClick={closeBookingModal}
                  >
                    Hủy
                  </button>
                  <button className="btn btn-primary" type="button">
                    Xác nhận đặt sân
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div
            className="modal-backdrop fade show"
            role="presentation"
            onClick={closeBookingModal}
          />
        </>
      )}
    </div>
  );
}

export default HomePage;
