FROM golang:latest as BUILD

ENV GO15VENDOREXPERIMENT=1

RUN go get github.com/prometheus/alertmanager/cmd/... \
 && cd /go/src/github.com/prometheus/alertmanager \
 && make build

FROM prom/prometheus@sha256:2d79525389d68a309db843c1888f364823afbbef32ffea4741024d2ab9994dd6

COPY --from=build /go/src/github.com/prometheus/alertmanager/alertmanager /bin/alertmanager
COPY --from=build /go/src/github.com/prometheus/alertmanager/amtool /bin/amtool
