document.addEventListener('DOMContentLoaded', function() {
    var calendarEl = document.getElementById('calendar');

    // ローカルストレージからイベントをロード
    var savedEvents = JSON.parse(localStorage.getItem('events')) || [];

    var calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        locale: 'ja',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
        },
        events: savedEvents,
        dateClick: function(info) {
            showCreateEventModal(info.dateStr);
        },
        eventClick: function(info) {
            showEventDetailModal(info.event);
        }
    });

    calendar.render();

    function showCreateEventModal(dateStr) {
        // モーダルのHTMLを生成
        var modalHtml = `
            <div class="modal fade" id="createEventModal" tabindex="-1" aria-labelledby="createEventModalLabel" aria-hidden="true">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <form id="createEventForm">
                            <div class="modal-header">
                                <h5 class="modal-title" id="createEventModalLabel">新規予約</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="閉じる"></button>
                            </div>
                            <div class="modal-body">
                                <div class="mb-3">
                                    <label for="member" class="form-label">予約者</label>
                                    <select class="form-select" id="member" required>
                                        <option value="" selected disabled>選択してください</option>
                                        <option value="大貫">大貫</option>
                                        <option value="坪井">坪井</option>
                                        <option value="清水">清水</option>
                                        <option value="高橋">高橋</option>
                                    </select>
                                </div>
                                <div class="mb-3">
                                    <label for="vehicle" class="form-label">車両</label>
                                    <select class="form-select" id="vehicle" required>
                                        <option value="" selected disabled>選択してください</option>
                                        <option value="平和島プロボックス">平和島プロボックス</option>
                                        <option value="ソリオ">ソリオ</option>
                                        <option value="稲沢プロボックス">稲沢プロボックス</option>
                                    </select>
                                </div>
                                <div class="mb-3">
                                    <label for="startTime" class="form-label">開始時間</label>
                                    <input type="datetime-local" class="form-control" id="startTime" step="900" required>
                                </div>
                                <div class="mb-3">
                                    <label for="endTime" class="form-label">終了時間</label>
                                    <input type="datetime-local" class="form-control" id="endTime" step="900" required>
                                </div>
                                <div class="mb-3">
                                    <label for="remarks" class="form-label">備考</label>
                                    <textarea class="form-control" id="remarks" rows="3"></textarea>
                                </div>
                            </div>
                            <div class="modal-footer">
                                <button type="submit" class="btn btn-primary">予約する</button>
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">キャンセル</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        var createEventModal = new bootstrap.Modal(document.getElementById('createEventModal'));
        createEventModal.show();

        // 開始時間と終了時間の初期値設定、15分単位の選択
        var startTimeInput = document.getElementById('startTime');
        var endTimeInput = document.getElementById('endTime');

        var now = new Date();
        now.setMinutes(Math.floor(now.getMinutes() / 15) * 15);
        var startDateTime = new Date(dateStr + 'T' + now.toTimeString().split(' ')[0]);
        startTimeInput.value = formatDateTimeLocal(startDateTime);

        var endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000); // デフォルト1時間後
        endTimeInput.value = formatDateTimeLocal(endDateTime);

        // フォームの送信イベント
        document.getElementById('createEventForm').addEventListener('submit', function(e) {
            e.preventDefault();
            var member = document.getElementById('member').value;
            var vehicle = document.getElementById('vehicle').value;
            var startTime = document.getElementById('startTime').value;
            var endTime = document.getElementById('endTime').value;
            var remarks = document.getElementById('remarks').value;

            if (new Date(startTime) >= new Date(endTime)) {
                alert("開始時間は終了時間より前に設定してください。");
                return;
            }

            var event = {
                id: Date.now().toString(),
                title: member + " - " + vehicle,
                start: startTime,
                end: endTime,
                extendedProps: {
                    member: member,
                    vehicle: vehicle,
                    remarks: remarks
                }
            };
            calendar.addEvent(event);

            // ローカルストレージにイベントを保存
            savedEvents.push(event);
            localStorage.setItem('events', JSON.stringify(savedEvents));

            createEventModal.hide();
            document.getElementById('createEventModal').remove();
        });

        document.getElementById('createEventModal').addEventListener('hidden.bs.modal', function() {
            this.remove();
        });
    }

    function showEventDetailModal(event) {
        // モーダルのHTMLを生成
        var modalHtml = `
            <div class="modal fade" id="eventDetailModal" tabindex="-1" aria-labelledby="eventDetailModalLabel" aria-hidden="true">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="eventDetailModalLabel">予約詳細</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="閉じる"></button>
                        </div>
                        <div class="modal-body">
                            <p><strong>予約者:</strong> ${event.extendedProps.member}</p>
                            <p><strong>車両:</strong> ${event.extendedProps.vehicle}</p>
                            <p><strong>開始時間:</strong> ${formatDisplayTime(event.start)}</p>
                            <p><strong>終了時間:</strong> ${formatDisplayTime(event.end)}</p>
                            <p><strong>備考:</strong> ${event.extendedProps.remarks || 'なし'}</p>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-danger" id="deleteEventButton">予約をキャンセル</button>
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">閉じる</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        var eventDetailModal = new bootstrap.Modal(document.getElementById('eventDetailModal'));
        eventDetailModal.show();

        document.getElementById('deleteEventButton').addEventListener('click', function() {
            if (confirm("この予約をキャンセルしますか？")) {
                // イベントを削除
                event.remove();
                // ローカルストレージからも削除
                savedEvents = savedEvents.filter(function(e) {
                    return e.id !== event.id;
                });
                localStorage.setItem('events', JSON.stringify(savedEvents));
                eventDetailModal.hide();
                document.getElementById('eventDetailModal').remove();
            }
        });

        document.getElementById('eventDetailModal').addEventListener('hidden.bs.modal', function() {
            this.remove();
        });
    }

    function formatDateTimeLocal(date) {
        var dateObj = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
        return dateObj.toISOString().slice(0,16);
    }

    function formatDisplayTime(date) {
        var options = { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' };
        return new Date(date).toLocaleString('ja-JP', options);
    }
});
